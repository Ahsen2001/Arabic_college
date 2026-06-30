<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\FinancialTransaction;
use App\Models\FeeType;
use App\Models\InstallmentPayment;
use App\Models\InstallmentPlan;
use App\Models\InvoiceDiscount;
use App\Models\Scholarship;
use App\Models\StudentInvoice;
use App\Models\StudentInvoiceItem;
use App\Models\StudentScholarship;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    // =========================================================================
    // LOOKUPS
    // =========================================================================

    public function getLookups(): JsonResponse
    {
        return ApiResponse::success([
            'fee_types'       => FeeType::where('is_active', true)->get(),
            'discounts'       => Discount::where('is_active', true)->get(),
            'scholarships'    => Scholarship::where('is_active', true)->get(),
            'invoice_statuses'=> DB::table('invoice_statuses')->get(),
            'payment_methods' => DB::table('payment_methods')->get(),
            'fee_categories'  => DB::table('fee_categories')->get(),
        ], 'Finance lookups loaded.');
    }

    // =========================================================================
    // FEE TYPES
    // =========================================================================

    public function getFeeTypes(): JsonResponse
    {
        return ApiResponse::success(FeeType::all(), 'Fee types loaded.');
    }

    public function storeFeeType(Request $request): JsonResponse
    {
        $request->validate([
            'name'           => ['required', 'string', 'max:100'],
            'code'           => ['required', 'string', 'max:30', 'unique:fee_types,code'],
            'default_amount' => ['required', 'numeric', 'min:0'],
            'is_recurring'   => ['boolean'],
            'is_mandatory'   => ['boolean'],
            'description'    => ['nullable', 'string'],
        ]);
        $ft = FeeType::create($request->all());
        return ApiResponse::success($ft, 'Fee type created.');
    }

    public function updateFeeType(Request $request, $id): JsonResponse
    {
        $ft = FeeType::findOrFail($id);
        $ft->update($request->only(['name', 'default_amount', 'is_recurring', 'is_mandatory', 'description', 'is_active']));
        return ApiResponse::success($ft, 'Fee type updated.');
    }

    // =========================================================================
    // INVOICES
    // =========================================================================

    public function getInvoices(Request $request): JsonResponse
    {
        $query = StudentInvoice::with([
            'student.user',
            'semester',
            'status',
            'items',
            'transactions.transactionType',
            'discounts.discount',
            'installmentPlan.payments',
        ])->withTrashed();

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        }
        if ($request->filled('search')) {
            $query->where('invoice_number', 'like', '%' . $request->search . '%');
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate(20);

        // Append virtual paid/outstanding
        $invoices->getCollection()->each(function ($inv) {
            $inv->total_paid    = $inv->total_paid;
            $inv->outstanding   = $inv->outstanding;
        });

        return ApiResponse::success($invoices, 'Invoices loaded.');
    }

    public function getInvoice($id): JsonResponse
    {
        $inv = StudentInvoice::with([
            'student.user',
            'semester',
            'status',
            'items',
            'transactions.transactionType',
            'transactions.paymentMethod',
            'discounts.discount',
            'installmentPlan.payments',
        ])->findOrFail($id);

        $inv->total_paid  = $inv->total_paid;
        $inv->outstanding = $inv->outstanding;

        return ApiResponse::success($inv, 'Invoice loaded.');
    }

    public function createInvoice(Request $request): JsonResponse
    {
        $request->validate([
            'student_id'  => ['required', 'integer', 'exists:students,id'],
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'due_date'    => ['required', 'date'],
            'items'       => ['required', 'array', 'min:1'],
            'items.*.fee_category_id' => ['required', 'integer'],
            'items.*.amount'          => ['required', 'numeric', 'min:0'],
            'items.*.description'     => ['nullable', 'string'],
        ]);

        DB::beginTransaction();
        try {
            $totalAmount = collect($request->items)->sum('amount');

            // Generate unique invoice number
            $year   = now()->year;
            $count  = StudentInvoice::whereYear('created_at', $year)->count() + 1;
            $invNum = 'INV-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // Draft status = 1
            $statusId = DB::table('invoice_statuses')->where('name', 'Draft')->value('id') ?? 1;

            $invoice = StudentInvoice::create([
                'student_id'     => $request->student_id,
                'semester_id'    => $request->semester_id,
                'invoice_number' => $invNum,
                'total_amount'   => $totalAmount,
                'due_date'       => $request->due_date,
                'status_id'      => $statusId,
            ]);

            foreach ($request->items as $item) {
                StudentInvoiceItem::create([
                    'student_invoice_id' => $invoice->id,
                    'fee_category_id'    => $item['fee_category_id'],
                    'amount'             => $item['amount'],
                    'description'        => $item['description'] ?? null,
                ]);
            }

            DB::commit();
            return ApiResponse::success($invoice->load(['items', 'status']), 'Invoice created.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Invoice creation failed: ' . $e->getMessage(), 500);
        }
    }

    public function issueInvoice($id): JsonResponse
    {
        $invoice = StudentInvoice::findOrFail($id);
        $issuedId = DB::table('invoice_statuses')->where('name', 'Issued')->value('id') ?? 2;
        $invoice->update(['status_id' => $issuedId]);
        return ApiResponse::success($invoice, 'Invoice issued.');
    }

    public function applyDiscount(Request $request, $invoiceId): JsonResponse
    {
        $request->validate([
            'discount_id' => ['required', 'integer', 'exists:discounts,id'],
        ]);

        $invoice  = StudentInvoice::findOrFail($invoiceId);
        $discount = Discount::findOrFail($request->discount_id);

        $applied = $discount->type === 'percentage'
            ? round($invoice->total_amount * ($discount->value / 100), 2)
            : $discount->value;

        InvoiceDiscount::create([
            'invoice_id'     => $invoice->id,
            'discount_id'    => $discount->id,
            'applied_amount' => $applied,
        ]);

        // Reduce invoice total
        $newTotal = max(0, $invoice->total_amount - $applied);
        $invoice->update(['total_amount' => $newTotal]);

        return ApiResponse::success([
            'applied_amount' => $applied,
            'new_total'      => $newTotal,
        ], 'Discount applied.');
    }

    // =========================================================================
    // PAYMENTS / TRANSACTIONS
    // =========================================================================

    public function recordPayment(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id'        => ['required', 'integer', 'exists:student_invoices,id'],
            'amount'            => ['required', 'numeric', 'min:0.01'],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
            'transaction_date'  => ['required', 'date'],
            'reference_number'  => ['nullable', 'string', 'max:100'],
            'description'       => ['nullable', 'string'],
        ]);

        DB::beginTransaction();
        try {
            // Credit type
            $creditTypeId = DB::table('transaction_types')->where('name', 'Credit')->value('id') ?? 1;

            $txn = FinancialTransaction::create([
                'transaction_type_id' => $creditTypeId,
                'amount'              => $request->amount,
                'transaction_date'    => $request->transaction_date,
                'payment_method_id'   => $request->payment_method_id,
                'reference_number'    => $request->reference_number,
                'invoice_id'          => $request->invoice_id,
                'description'         => $request->description,
            ]);

            // Recalculate invoice status
            $invoice   = StudentInvoice::findOrFail($request->invoice_id);
            $totalPaid = $invoice->total_paid;

            if ($totalPaid >= (float) $invoice->total_amount) {
                $paidStatusId = DB::table('invoice_statuses')->where('name', 'Paid')->value('id') ?? 4;
                $invoice->update(['status_id' => $paidStatusId]);
            } elseif ($totalPaid > 0) {
                $partialStatusId = DB::table('invoice_statuses')->where('name', 'Partial')->value('id') ?? 3;
                $invoice->update(['status_id' => $partialStatusId]);
            }

            DB::commit();
            return ApiResponse::success(
                $txn->load(['transactionType', 'paymentMethod']),
                'Payment recorded.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Payment failed: ' . $e->getMessage(), 500);
        }
    }

    public function getTransactions(Request $request): JsonResponse
    {
        $query = FinancialTransaction::with(['invoice.student.user', 'transactionType', 'paymentMethod'])
            ->withTrashed();

        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        $txns = $query->orderBy('transaction_date', 'desc')->paginate(30);
        return ApiResponse::success($txns, 'Transactions loaded.');
    }

    // =========================================================================
    // INSTALLMENT PLANS
    // =========================================================================

    public function createInstallmentPlan(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id'          => ['required', 'integer', 'exists:student_invoices,id'],
            'total_installments'  => ['required', 'integer', 'min:2', 'max:12'],
            'first_due_date'      => ['required', 'date'],
            'interval_days'       => ['integer', 'min:7', 'max:90'],
        ]);

        $invoice = StudentInvoice::findOrFail($request->invoice_id);

        if ($invoice->installmentPlan) {
            return ApiResponse::error('An installment plan already exists for this invoice.', 409);
        }

        $installmentAmount = round($invoice->total_amount / $request->total_installments, 2);

        DB::beginTransaction();
        try {
            $plan = InstallmentPlan::create([
                'invoice_id'         => $invoice->id,
                'total_installments' => $request->total_installments,
                'installment_amount' => $installmentAmount,
                'first_due_date'     => $request->first_due_date,
                'interval_days'      => $request->interval_days ?? 30,
            ]);

            // Auto-generate installment rows
            $dueDate = \Carbon\Carbon::parse($request->first_due_date);
            for ($i = 1; $i <= $request->total_installments; $i++) {
                InstallmentPayment::create([
                    'installment_plan_id' => $plan->id,
                    'installment_number'  => $i,
                    'due_date'            => ($i === 1) ? $dueDate->toDateString() : $dueDate->addDays($request->interval_days ?? 30)->toDateString(),
                    'amount_due'          => $installmentAmount,
                ]);
            }

            DB::commit();
            return ApiResponse::success($plan->load('payments'), 'Installment plan created.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Plan creation failed: ' . $e->getMessage(), 500);
        }
    }

    public function payInstallment(Request $request, $installmentId): JsonResponse
    {
        $request->validate([
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
            'reference_number'  => ['nullable', 'string'],
        ]);

        $installment = InstallmentPayment::with('plan.invoice')->findOrFail($installmentId);

        if ($installment->status === 'Paid') {
            return ApiResponse::error('This installment is already paid.', 409);
        }

        DB::beginTransaction();
        try {
            $creditTypeId = DB::table('transaction_types')->where('name', 'Credit')->value('id') ?? 1;

            $txn = FinancialTransaction::create([
                'transaction_type_id' => $creditTypeId,
                'amount'              => $installment->amount_due,
                'transaction_date'    => now()->toDateString(),
                'payment_method_id'   => $request->payment_method_id,
                'reference_number'    => $request->reference_number,
                'invoice_id'          => $installment->plan->invoice_id,
                'description'         => 'Installment #' . $installment->installment_number,
            ]);

            $installment->update([
                'status'         => 'Paid',
                'paid_date'      => now()->toDateString(),
                'amount_paid'    => $installment->amount_due,
                'transaction_id' => $txn->id,
            ]);

            // Check if plan is complete
            $pendingCount = InstallmentPayment::where('installment_plan_id', $installment->installment_plan_id)
                ->whereNotIn('status', ['Paid', 'Waived'])->count();
            if ($pendingCount === 0) {
                $installment->plan->update(['status' => 'Completed']);
            }

            DB::commit();
            return ApiResponse::success($installment->fresh(), 'Installment paid.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Payment failed: ' . $e->getMessage(), 500);
        }
    }

    // =========================================================================
    // SCHOLARSHIPS
    // =========================================================================

    public function getScholarships(): JsonResponse
    {
        return ApiResponse::success(Scholarship::withCount('studentAwards')->get(), 'Scholarships loaded.');
    }

    public function storeScholarship(Request $request): JsonResponse
    {
        $request->validate([
            'name'           => ['required', 'string'],
            'code'           => ['required', 'string', 'unique:scholarships,code'],
            'coverage_type'  => ['required', 'in:percentage,fixed'],
            'coverage_value' => ['required', 'numeric', 'min:0'],
        ]);
        $s = Scholarship::create($request->all());
        return ApiResponse::success($s, 'Scholarship created.');
    }

    public function awardScholarship(Request $request): JsonResponse
    {
        $request->validate([
            'student_id'     => ['required', 'integer', 'exists:students,id'],
            'scholarship_id' => ['required', 'integer', 'exists:scholarships,id'],
            'awarded_date'   => ['required', 'date'],
            'expiry_date'    => ['nullable', 'date', 'after:awarded_date'],
            'notes'          => ['nullable', 'string'],
        ]);

        $award = StudentScholarship::create($request->all());
        return ApiResponse::success($award->load(['student.user', 'scholarship']), 'Scholarship awarded.');
    }

    public function getStudentScholarships($studentId): JsonResponse
    {
        $awards = StudentScholarship::with('scholarship')
            ->where('student_id', $studentId)
            ->get();
        return ApiResponse::success($awards, 'Student scholarships loaded.');
    }

    // =========================================================================
    // DISCOUNTS
    // =========================================================================

    public function getDiscounts(): JsonResponse
    {
        return ApiResponse::success(Discount::all(), 'Discounts loaded.');
    }

    public function storeDiscount(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => ['required', 'string'],
            'code'       => ['required', 'string', 'unique:discounts,code'],
            'type'       => ['required', 'in:percentage,fixed'],
            'value'      => ['required', 'numeric', 'min:0'],
        ]);
        return ApiResponse::success(Discount::create($request->all()), 'Discount created.');
    }

    // =========================================================================
    // OUTSTANDING REPORT
    // =========================================================================

    public function getOutstanding(): JsonResponse
    {
        $invoices = StudentInvoice::with(['student.user', 'semester', 'status', 'transactions.transactionType'])
            ->whereHas('status', fn($q) => $q->whereIn('name', ['Issued', 'Partial', 'Overdue']))
            ->get()
            ->map(function ($inv) {
                return [
                    'id'             => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'student_name'   => $inv->student?->user?->name,
                    'student_id_no'  => $inv->student?->student_id_number,
                    'semester'       => $inv->semester?->name,
                    'total_amount'   => $inv->total_amount,
                    'total_paid'     => $inv->total_paid,
                    'outstanding'    => $inv->outstanding,
                    'due_date'       => $inv->due_date,
                    'status'         => $inv->status?->name,
                    'is_overdue'     => $inv->due_date && now()->gt($inv->due_date),
                ];
            })
            ->sortByDesc('outstanding')
            ->values();

        return ApiResponse::success($invoices, 'Outstanding dues report.');
    }

    // =========================================================================
    // ANALYTICS / CHARTS
    // =========================================================================

    public function getAnalytics(): JsonResponse
    {
        // Monthly collection for last 6 months
        $monthly = DB::table('financial_transactions')
            ->join('transaction_types', 'financial_transactions.transaction_type_id', '=', 'transaction_types.id')
            ->where('transaction_types.name', 'Credit')
            ->where('transaction_date', '>=', now()->subMonths(6)->toDateString())
            ->selectRaw('DATE_FORMAT(transaction_date, "%Y-%m") as month, SUM(amount) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Invoice status breakdown
        $statusBreakdown = DB::table('student_invoices')
            ->join('invoice_statuses', 'student_invoices.status_id', '=', 'invoice_statuses.id')
            ->whereNull('student_invoices.deleted_at')
            ->selectRaw('invoice_statuses.name as status, COUNT(*) as count, SUM(total_amount) as total')
            ->groupBy('invoice_statuses.name')
            ->get();

        // Payment method breakdown
        $paymentMethodStats = DB::table('financial_transactions')
            ->join('payment_methods', 'financial_transactions.payment_method_id', '=', 'payment_methods.id')
            ->join('transaction_types', 'financial_transactions.transaction_type_id', '=', 'transaction_types.id')
            ->where('transaction_types.name', 'Credit')
            ->selectRaw('payment_methods.name as method, SUM(amount) as total')
            ->groupBy('payment_methods.name')
            ->get();

        // Total revenue and outstanding
        $totalRevenue    = FinancialTransaction::whereHas('transactionType', fn($q) => $q->where('name', 'Credit'))->sum('amount');
        $totalOutstanding = StudentInvoice::whereHas('status', fn($q) => $q->whereIn('name', ['Issued', 'Partial', 'Overdue']))->get()->sum('outstanding');
        $totalInvoiced   = StudentInvoice::whereNull('deleted_at')->sum('total_amount');

        return ApiResponse::success([
            'monthly_collections'  => $monthly,
            'status_breakdown'     => $statusBreakdown,
            'payment_method_stats' => $paymentMethodStats,
            'totals'               => [
                'revenue'     => round($totalRevenue, 2),
                'outstanding' => round($totalOutstanding, 2),
                'invoiced'    => round($totalInvoiced, 2),
            ],
        ], 'Finance analytics compiled.');
    }
}
