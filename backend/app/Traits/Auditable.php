<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    /**
     * Boot the trait to hook into model events.
     */
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            self::logAudit('create', $model);
        });

        static::updated(function (Model $model) {
            self::logAudit('update', $model);
        });

        static::deleted(function (Model $model) {
            self::logAudit('delete', $model);
        });
    }

    /**
     * Log the audit entry.
     */
    protected static function logAudit(string $action, Model $model): void
    {
        // Don't audit AuditLog itself to prevent recursion
        if ($model instanceof AuditLog) {
            return;
        }

        $userId = Auth::id();
        $ip = request()->ip();
        $userAgent = request()->userAgent();

        $oldValues = null;
        $newValues = null;

        // Fields to omit from log files for security and compliance
        $sensitiveFields = ['password', 'remember_token', 'token', 'otp'];

        if ($action === 'create') {
            $newValues = collect($model->getAttributes())
                ->except($sensitiveFields)
                ->toArray();
        } elseif ($action === 'update') {
            $changes = $model->getChanges();
            // Ignore updated_at timestamps changes when no other changes exist
            unset($changes['updated_at']);
            if (empty($changes)) {
                return;
            }

            $oldValues = collect($model->getOriginal())
                ->only(array_keys($changes))
                ->except($sensitiveFields)
                ->toArray();

            $newValues = collect($changes)
                ->except($sensitiveFields)
                ->toArray();
        } elseif ($action === 'delete') {
            $oldValues = collect($model->getAttributes())
                ->except($sensitiveFields)
                ->toArray();
        }

        AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'model_type' => get_class($model),
            'model_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
        ]);
    }
}
