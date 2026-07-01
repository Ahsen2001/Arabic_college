<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name_ar',
        'name_en',
        'code',
        'head_teacher_id',
    ];

    protected $appends = ['translated_name'];

    public function getTranslatedNameAttribute(): string
    {
        $locale = app()->getLocale();
        if ($locale === 'ar') {
            return $this->name_ar;
        }
        if ($locale === 'en') {
            return $this->name_en;
        }

        $key = 'messages.departments.' . $this->code;
        $translated = __($key);

        return $translated !== $key ? $translated : ($this->name_en ?: $this->name_ar);
    }

    public function headTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'head_teacher_id');
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }

    public function teachers(): HasMany
    {
        return $this->hasMany(Teacher::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function researchProjects(): HasMany
    {
        return $this->hasMany(ResearchProject::class);
    }
}
