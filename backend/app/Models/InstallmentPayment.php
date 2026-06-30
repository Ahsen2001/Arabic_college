<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstallmentPayment extends Model
{
    protected $table = 'installment_payments';

    protected $fillable = [
        'installment_plan_id', 'installment_number', 'due_date',
        'paid_date', 'amount_due', 'amount_paid', 'transaction_id', 'status',
    ];

    protected $casts = [
        'amount_due'  => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'due_date'    => 'date',
        'paid_date'   => 'date',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(InstallmentPlan::class, 'installment_plan_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(FinancialTransaction::class, 'transaction_id');
    }
}
