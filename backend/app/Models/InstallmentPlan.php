<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstallmentPlan extends Model
{
    protected $table = 'installment_plans';

    protected $fillable = [
        'invoice_id', 'total_installments', 'installment_amount',
        'first_due_date', 'interval_days', 'status',
    ];

    protected $casts = [
        'installment_amount' => 'decimal:2',
        'first_due_date'     => 'date',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(StudentInvoice::class, 'invoice_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InstallmentPayment::class, 'installment_plan_id');
    }
}
