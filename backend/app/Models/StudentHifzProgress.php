<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentHifzProgress extends Model
{
    use HasFactory;

    protected $table = 'student_hifz_progress';

    protected $fillable = [
        'student_id',
        'current_juz',
        'current_surah',
        'current_ayah',
        'completion_percentage',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
