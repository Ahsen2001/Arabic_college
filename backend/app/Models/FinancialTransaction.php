<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinancialTransaction extends Model
{
    use SoftDeletes;

    protected $table = 'financial_transactions';

    protected $fillable = [
        'transaction_type_id', 'amount', 'transaction_date', 'payment_method_id',
        'reference_number', 'invoice_id', 'description', 'handled_by_staff_id',
    ];

    protected $casts = [
        'amount'           => 'decimal:2',
        'transaction_date' => 'date',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(StudentInvoice::class, 'invoice_id');
    }

    public function transactionType(): BelongsTo
    {
        return $this->belongsTo(\App\Models\TransactionType::class, 'transaction_type_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(\App\Models\PaymentMethod::class, 'payment_method_id');
    }

    public function handledBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'handled_by_staff_id');
    }
}
