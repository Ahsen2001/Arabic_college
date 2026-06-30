<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HifzDailyLog extends Model
{
    use HasFactory;

    protected $table = 'hifz_daily_logs';

    protected $fillable = [
        'student_id',
        'log_date',
        'sabaq_surah',
        'sabaq_ayah_start',
        'sabaq_ayah_end',
        'sabaq_status',
        'sabki_juz',
        'sabki_page_start',
        'sabki_page_end',
        'sabki_status',
        'manzil_juz',
        'manzil_status',
        'mistakes_count',
        'tajweed_score',
        'teacher_remarks',
        'marked_by_user_id',
    ];

    protected $casts = [
        'log_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function markedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marked_by_user_id');
    }
}
