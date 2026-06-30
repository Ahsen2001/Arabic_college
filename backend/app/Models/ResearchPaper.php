<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ResearchPaper extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'research_papers';

    protected $fillable = [
        'user_id',
        'supervisor_user_id',
        'title',
        'abstract',
        'category',
        'keywords',
        'status',
        'remarks',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_user_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ResearchPaperVersion::class);
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(ResearchPaperVersion::class)->latestOfMany();
    }
}
