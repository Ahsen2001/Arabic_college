<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'student_id_number',
        'program_id',
        'admission_semester_id',
        'status_id',
        'admission_date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function admissionSemester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'admission_semester_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentCourseEnrollment::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(StudentAttendance::class);
    }

    public function examResults(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(StudentInvoice::class);
    }

    public function semesterGpas(): HasMany
    {
        return $this->hasMany(StudentSemesterGpa::class);
    }
}
