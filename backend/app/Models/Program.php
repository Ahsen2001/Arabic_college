<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Program extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'department_id',
        'name_ar',
        'name_en',
        'code',
        'duration_years',
        'total_credits',
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

        $key = 'messages.programs.' . $this->code;
        $translated = __($key);

        return $translated !== $key ? $translated : ($this->name_en ?: $this->name_ar);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function curriculumItems(): HasMany
    {
        return $this->hasMany(CurriculumItem::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'curriculum_items');
    }
}
