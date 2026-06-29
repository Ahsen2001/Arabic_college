<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentInvoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'student_invoices';

    protected $fillable = [
        'student_id',
        'semester_id',
        'invoice_number',
        'total_amount',
        'due_date',
        'status_id',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StudentInvoiceItem::class, 'student_invoice_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class, 'invoice_id');
    }
}
