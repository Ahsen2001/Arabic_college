<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\Auditable;

    protected $table = 'exam_results';

    protected $fillable = [
        'examination_id',
        'student_id',
        'marks_obtained',
        'grade_id',
        'remarks',
        'graded_by_user_id',
    ];

    protected $casts = [
        'marks_obtained' => 'decimal:2',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function gradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by_user_id');
    }
}
