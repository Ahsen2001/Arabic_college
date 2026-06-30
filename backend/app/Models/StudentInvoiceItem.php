<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class StudentInvoiceItem extends Model
{
    protected $table = 'student_invoice_items';
    protected $fillable = ['student_invoice_id', 'fee_category_id', 'amount', 'description'];
    protected $casts = ['amount' => 'decimal:2'];
    public function invoice(): BelongsTo { return $this->belongsTo(StudentInvoice::class, 'student_invoice_id'); }
}
