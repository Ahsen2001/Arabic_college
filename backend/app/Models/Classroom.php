<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Classroom extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'building',
        'type',
        'capacity',
        'has_projector',
        'has_ac',
        'is_active',
    ];

    protected $casts = [
        'has_projector' => 'boolean',
        'has_ac'        => 'boolean',
        'is_active'     => 'boolean',
    ];

    public function timetableSlots(): HasMany
    {
        return $this->hasMany(TimetableAllocation::class);
    }
}
