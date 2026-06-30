<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HifzMilestone extends Model
{
    use HasFactory;

    protected $table = 'hifz_milestones';

    protected $fillable = [
        'student_id',
        'milestone_name',
        'completion_date',
        'verified_by_user_id',
        'remarks',
    ];

    protected $casts = [
        'completion_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }
}
