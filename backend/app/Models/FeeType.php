<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'code', 'default_amount', 'is_recurring', 'is_mandatory', 'description', 'is_active',
    ];

    protected $casts = [
        'default_amount' => 'decimal:2',
        'is_recurring'   => 'boolean',
        'is_mandatory'   => 'boolean',
        'is_active'      => 'boolean',
    ];
}
