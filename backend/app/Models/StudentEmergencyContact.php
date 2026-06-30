<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentEmergencyContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'name',
        'relationship',
        'phone',
        'alternate_phone',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
