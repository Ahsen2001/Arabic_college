<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'recipient_email',
        'subject',
        'body',
        'status',
        'error_message',
        'sent_at',
        'triggered_by_user_id',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function triggerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by_user_id');
    }
}
