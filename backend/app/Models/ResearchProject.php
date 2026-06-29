<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResearchProject extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'abstract',
        'department_id',
        'status_id',
        'budget',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ResearchMember::class);
    }

    public function publications(): HasMany
    {
        return $this->hasMany(ResearchPublication::class);
    }
}
