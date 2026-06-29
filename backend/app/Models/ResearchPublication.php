<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchPublication extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'research_publications';

    protected $fillable = [
        'research_project_id',
        'title',
        'authors',
        'journal_name',
        'publication_date',
        'doi_number',
        'url',
    ];

    protected $casts = [
        'publication_date' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(ResearchProject::class, 'research_project_id');
    }
}
