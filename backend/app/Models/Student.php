<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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

    public function guardian(): HasOne
    {
        return $this->hasOne(StudentGuardian::class);
    }

    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(StudentEmergencyContact::class);
    }

    public function educationHistories(): HasMany
    {
        return $this->hasMany(StudentEducationHistory::class);
    }

    public function medicalRecord(): HasOne
    {
        return $this->hasOne(StudentMedicalRecord::class);
    }

    public function scholarships(): HasMany
    {
        return $this->hasMany(StudentScholarship::class);
    }

    public function assignmentSubmissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function hifzProgress(): HasOne
    {
        return $this->hasOne(StudentHifzProgress::class);
    }

    public function hifzDailyLogs(): HasMany
    {
        return $this->hasMany(HifzDailyLog::class);
    }

    public function hifzAssessments(): HasMany
    {
        return $this->hasMany(HifzAssessment::class);
    }

    public function hifzMilestones(): HasMany
    {
        return $this->hasMany(HifzMilestone::class);
    }
}
