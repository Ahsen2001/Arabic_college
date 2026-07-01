<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subject extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'department_id',
        'name_ar',
        'name_en',
        'code',
        'credit_hours',
        'description',
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

        $key = 'messages.subjects.' . $this->code;
        $translated = __($key);

        return $translated !== $key ? $translated : ($this->name_en ?: $this->name_ar);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'subject_prerequisites', 'subject_id', 'prerequisite_subject_id');
    }

    public function prerequisiteFor(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'subject_prerequisites', 'prerequisite_subject_id', 'subject_id');
    }
}
