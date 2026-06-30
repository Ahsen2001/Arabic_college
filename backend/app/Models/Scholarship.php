<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Scholarship extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code', 'coverage_type', 'coverage_value',
        'seats_available', 'application_open', 'application_close', 'is_active', 'description',
    ];

    protected $casts = [
        'coverage_value'   => 'decimal:2',
        'is_active'        => 'boolean',
        'application_open' => 'date',
        'application_close'=> 'date',
    ];

    public function studentAwards(): HasMany
    {
        return $this->hasMany(StudentScholarship::class);
    }
}
