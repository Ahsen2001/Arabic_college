<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSemesterGpa extends Model
{
    use HasFactory;

    protected $table = 'student_semester_gpas';

    protected $fillable = [
        'student_id',
        'semester_id',
        'gpa',
        'total_credits_attempted',
        'total_credits_earned',
    ];

    protected $casts = [
        'gpa' => 'decimal:2',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }
}
