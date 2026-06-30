<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentMedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'blood_type',
        'allergies',
        'chronic_conditions',
        'emergency_notes',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
