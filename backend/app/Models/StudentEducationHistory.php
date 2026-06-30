<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentEducationHistory extends Model
{
    use HasFactory;

    protected $table = 'student_education_histories';

    protected $fillable = [
        'student_id',
        'institution_name',
        'degree_diploma',
        'passing_year',
        'gpa_percentage',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
