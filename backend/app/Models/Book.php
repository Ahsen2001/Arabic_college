<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'title',
        'authors',
        'publisher',
        'isbn',
        'publication_year',
        'total_copies',
        'available_copies',
        'shelf_location',
    ];

    public function borrows(): HasMany
    {
        return $this->hasMany(LibraryBorrow::class);
    }
}
