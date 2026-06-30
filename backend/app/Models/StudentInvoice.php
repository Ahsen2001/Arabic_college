<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class StudentInvoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'student_invoices';

    protected $fillable = [
        'student_id', 'semester_id', 'invoice_number',
        'total_amount', 'due_date', 'status_id',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'due_date'     => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(\App\Models\InvoiceStatus::class, 'status_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StudentInvoiceItem::class, 'student_invoice_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class, 'invoice_id');
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(InvoiceDiscount::class, 'invoice_id');
    }

    public function installmentPlan(): HasOne
    {
        return $this->hasOne(InstallmentPlan::class, 'invoice_id');
    }

    // Compute total paid from transactions
    public function getTotalPaidAttribute(): float
    {
        return (float) $this->transactions()
            ->whereHas('transactionType', fn($q) => $q->where('name', 'Credit'))
            ->sum('amount');
    }

    // Compute outstanding balance
    public function getOutstandingAttribute(): float
    {
        return max(0, (float) $this->total_amount - $this->total_paid);
    }
}
