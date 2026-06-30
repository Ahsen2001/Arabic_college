<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fee Types (richer than fee_categories lookup)
        if (!Schema::hasTable('fee_types')) {
            Schema::create('fee_types', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code', 30)->unique();
                $table->decimal('default_amount', 10, 2)->default(0);
                $table->boolean('is_recurring')->default(false);
                $table->boolean('is_mandatory')->default(true);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 2. Discounts / Waivers
        if (!Schema::hasTable('discounts')) {
            Schema::create('discounts', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code', 40)->unique();
                $table->enum('type', ['percentage', 'fixed'])->default('percentage');
                $table->decimal('value', 8, 2);
                $table->boolean('is_active')->default(true);
                $table->date('valid_from')->nullable();
                $table->date('valid_until')->nullable();
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // 3. Scholarships
        if (!Schema::hasTable('scholarships')) {
            Schema::create('scholarships', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code', 40)->unique();
                $table->enum('coverage_type', ['percentage', 'fixed'])->default('percentage');
                $table->decimal('coverage_value', 8, 2);
                $table->unsignedSmallInteger('seats_available')->nullable();
                $table->date('application_open')->nullable();
                $table->date('application_close')->nullable();
                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // 4. Student Scholarship Awards
        if (!Schema::hasTable('student_scholarships')) {
            Schema::create('student_scholarships', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
                $table->foreignId('scholarship_id')->constrained('scholarships')->onDelete('restrict');
                $table->date('awarded_date');
                $table->date('expiry_date')->nullable();
                $table->enum('status', ['Active', 'Expired', 'Cancelled'])->default('Active');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index('student_id');
                $table->index('scholarship_id');
            });
        }

        // 5. Invoice discount junction
        if (!Schema::hasTable('invoice_discounts')) {
            Schema::create('invoice_discounts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('invoice_id')->constrained('student_invoices')->onDelete('cascade');
                $table->foreignId('discount_id')->constrained('discounts')->onDelete('restrict');
                $table->decimal('applied_amount', 10, 2);
                $table->timestamps();
                $table->index('invoice_id');
            });
        }

        // 6. Installment Plans (header)
        if (!Schema::hasTable('installment_plans')) {
            Schema::create('installment_plans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('invoice_id')->constrained('student_invoices')->onDelete('cascade');
                $table->unsignedTinyInteger('total_installments');
                $table->decimal('installment_amount', 10, 2);
                $table->date('first_due_date');
                $table->unsignedSmallInteger('interval_days')->default(30);
                $table->enum('status', ['Active', 'Completed', 'Defaulted'])->default('Active');
                $table->timestamps();
                $table->index('invoice_id');
            });
        }

        // 7. Installment Payments (detail rows)
        if (!Schema::hasTable('installment_payments')) {
            Schema::create('installment_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('installment_plan_id')->constrained('installment_plans')->onDelete('cascade');
                $table->unsignedTinyInteger('installment_number');
                $table->date('due_date');
                $table->date('paid_date')->nullable();
                $table->decimal('amount_due', 10, 2);
                $table->decimal('amount_paid', 10, 2)->default(0);
                $table->foreignId('transaction_id')->nullable()->constrained('financial_transactions')->nullOnDelete();
                $table->enum('status', ['Pending', 'Paid', 'Overdue', 'Waived'])->default('Pending');
                $table->timestamps();
                $table->index('installment_plan_id');
            });
        }

        // ── Seed Lookup Tables ─────────────────────────────────────────────────
        $now = now();

        DB::table('invoice_statuses')->insertOrIgnore([
            ['name' => 'Draft',        'description' => 'Not yet issued',        'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Issued',       'description' => 'Sent to student',        'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partial',      'description' => 'Partially paid',         'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Paid',         'description' => 'Fully settled',          'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Overdue',      'description' => 'Past due date unpaid',   'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Cancelled',    'description' => 'Voided',                 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('transaction_types')->insertOrIgnore([
            ['name' => 'Credit',  'description' => 'Payment received',    'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Debit',   'description' => 'Charge applied',      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Refund',  'description' => 'Refund to student',   'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('payment_methods')->insertOrIgnore([
            ['name' => 'Cash',          'description' => 'Physical cash',          'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Bank Transfer', 'description' => 'Wire or NEFT',           'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Cheque',        'description' => 'Cheque payment',         'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Online',        'description' => 'Online portal payment',  'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('fee_categories')->insertOrIgnore([
            ['name' => 'Tuition',      'description' => 'Core tuition fee',       'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Exam',         'description' => 'Examination fee',        'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Library',      'description' => 'Library access fee',     'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Transport',    'description' => 'Transport surcharge',     'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Hostel',       'description' => 'Hostel / accommodation', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Miscellaneous','description' => 'Other charges',           'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('fee_types')->insertOrIgnore([
            ['name' => 'Tuition Fee',      'code' => 'TUI',  'default_amount' => 25000, 'is_recurring' => true,  'is_mandatory' => true,  'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Examination Fee',  'code' => 'EXAM', 'default_amount' => 3000,  'is_recurring' => true,  'is_mandatory' => true,  'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Library Fee',      'code' => 'LIB',  'default_amount' => 1000,  'is_recurring' => false, 'is_mandatory' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Transport Fee',    'code' => 'TRN',  'default_amount' => 5000,  'is_recurring' => true,  'is_mandatory' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Hostel Fee',       'code' => 'HOS',  'default_amount' => 12000, 'is_recurring' => true,  'is_mandatory' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Registration Fee', 'code' => 'REG',  'default_amount' => 2500,  'is_recurring' => false, 'is_mandatory' => true,  'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('discounts')->insertOrIgnore([
            ['name' => 'Early Payment',    'code' => 'EARLY10', 'type' => 'percentage', 'value' => 10, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Sibling Discount', 'code' => 'SIBLING', 'type' => 'percentage', 'value' => 15, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Merit Waiver',     'code' => 'MERIT20', 'type' => 'percentage', 'value' => 20, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Staff Concession', 'code' => 'STAFF50', 'type' => 'percentage', 'value' => 50, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('scholarships')->insertOrIgnore([
            ['name' => 'Hafiz al-Quran Scholarship', 'code' => 'HAQ-FULL', 'coverage_type' => 'percentage', 'coverage_value' => 100, 'seats_available' => 10, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Academic Excellence Award',  'code' => 'ACA-50',   'coverage_type' => 'percentage', 'coverage_value' => 50,  'seats_available' => 20, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Need-Based Grant',           'code' => 'NBG-FIX',  'coverage_type' => 'fixed',      'coverage_value' => 15000,'seats_available' => null,'is_active' => true,'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('installment_payments');
        Schema::dropIfExists('installment_plans');
        Schema::dropIfExists('invoice_discounts');
        Schema::dropIfExists('student_scholarships');
        Schema::dropIfExists('scholarships');
        Schema::dropIfExists('discounts');
        Schema::dropIfExists('fee_types');
    }
};
