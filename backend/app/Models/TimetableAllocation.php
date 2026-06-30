<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableAllocation extends Model
{
    use HasFactory;

    protected $table = 'timetable_allocations';

    protected $fillable = [
        'course_id',
        'teacher_user_id',
        'classroom_id',
        'day_of_week',
        'start_time',
        'end_time',
        'classroom',
        'notes',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
    ];

    // Day label helper
    public static array $DAYS = [
        1 => 'Sunday',
        2 => 'Monday',
        3 => 'Tuesday',
        4 => 'Wednesday',
        5 => 'Thursday',
        6 => 'Friday',
        7 => 'Saturday',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_user_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Classroom::class, 'classroom_id');
    }
}
