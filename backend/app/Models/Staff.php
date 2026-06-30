<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    use HasFactory, SoftDeletes;

    // Set custom table name since 'staff' is an irregular plural in English and Laravel infers 'staffs' by default
    protected $table = 'staff';

    protected $fillable = [
        'user_id',
        'staff_id_number',
        'department_id',
        'staff_role_id',
        'status_id',
        'joining_date',
    ];

    protected $casts = [
        'joining_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function libraryBorrows(): HasMany
    {
        return $this->hasMany(LibraryBorrow::class, 'issued_by_staff_id');
    }

    public function financialTransactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class, 'handled_by_staff_id');
    }
}
