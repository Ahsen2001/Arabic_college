<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentScholarship extends Model
{
    use HasFactory;

    protected $table = 'student_scholarships';

    protected $fillable = [
        'student_id', 'scholarship_id', 'awarded_date', 'expiry_date', 'status', 'notes',
    ];

    protected $casts = [
        'awarded_date' => 'date',
        'expiry_date'  => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(Scholarship::class);
    }
}
