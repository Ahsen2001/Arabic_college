<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HifzAssessment extends Model
{
    use HasFactory;

    protected $table = 'hifz_assessments';

    protected $fillable = [
        'student_id',
        'assessment_type',
        'assessment_date',
        'juz_tested',
        'memorization_score',
        'tajweed_score',
        'grade',
        'remarks',
        'assessed_by_user_id',
    ];

    protected $casts = [
        'assessment_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function assessedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessed_by_user_id');
    }
}
