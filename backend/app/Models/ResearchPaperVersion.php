<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchPaperVersion extends Model
{
    use HasFactory;

    protected $table = 'research_paper_versions';

    protected $fillable = [
        'research_paper_id',
        'version_number',
        'file_path',
        'original_filename',
        'notes',
    ];

    public function paper(): BelongsTo
    {
        return $this->belongsTo(ResearchPaper::class, 'research_paper_id');
    }
}
