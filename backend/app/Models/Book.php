<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'title',
        'authors',
        'publisher',
        'isbn',
        'barcode',
        'publication_year',
        'total_copies',
        'available_copies',
        'shelf_location',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(BookCategory::class, 'category_id');
    }

    public function borrows(): HasMany
    {
        return $this->hasMany(LibraryBorrow::class);
    }
}
