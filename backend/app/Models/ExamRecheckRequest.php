<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamRecheckRequest extends Model
{
    use HasFactory;

    protected $table = 'exam_recheck_requests';

    protected $fillable = [
        'exam_result_id',
        'student_id',
        'reason',
        'status',
        'new_marks',
        'teacher_remarks',
    ];

    public function examResult(): BelongsTo
    {
        return $this->belongsTo(ExamResult::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
