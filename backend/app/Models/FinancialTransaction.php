<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'financial_transactions';

    protected $fillable = [
        'transaction_type_id',
        'amount',
        'transaction_date',
        'payment_method_id',
        'reference_number',
        'invoice_id',
        'description',
        'handled_by_staff_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(StudentInvoice::class, 'invoice_id');
    }

    public function handledBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'handled_by_staff_id');
    }
}
