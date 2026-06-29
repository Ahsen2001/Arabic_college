<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SystemNotification extends Model
{
    use HasFactory;

    protected $table = 'system_notifications';

    protected $fillable = [
        'notification_type_id',
        'title',
        'message',
        'sender_user_id',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(UserNotification::class, 'notification_id');
    }
}
