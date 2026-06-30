<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class InvoiceDiscount extends Model
{
    protected $table = 'invoice_discounts';
    protected $fillable = ['invoice_id', 'discount_id', 'applied_amount'];
    protected $casts = ['applied_amount' => 'decimal:2'];
    public function invoice(): BelongsTo { return $this->belongsTo(StudentInvoice::class, 'invoice_id'); }
    public function discount(): BelongsTo { return $this->belongsTo(Discount::class); }
}
