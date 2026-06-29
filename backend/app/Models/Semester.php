<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Semester extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'academic_year_id',
        'name',
        'code',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function studentsAdmitted(): HasMany
    {
        return $this->hasMany(Student::class, 'admission_semester_id');
    }

    public function studentInvoices(): HasMany
    {
        return $this->hasMany(StudentInvoice::class);
    }

    public function semesterGpas(): HasMany
    {
        return $this->hasMany(StudentSemesterGpa::class);
    }
}
