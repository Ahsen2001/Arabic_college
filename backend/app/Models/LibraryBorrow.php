<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LibraryBorrow extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'library_borrows';

    protected $fillable = [
        'book_id',
        'user_id',
        'borrow_date',
        'due_date',
        'return_date',
        'status_id',
        'fine_amount',
        'issued_by_staff_id',
    ];

    protected $casts = [
        'borrow_date' => 'date',
        'due_date' => 'date',
        'return_date' => 'date',
        'fine_amount' => 'decimal:2',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(BorrowStatus::class, 'status_id');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'issued_by_staff_id');
    }
}
