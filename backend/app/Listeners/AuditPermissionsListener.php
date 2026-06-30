<?php

namespace App\Listeners;

use Spatie\Permission\Events\RoleAttached;
use Spatie\Permission\Events\RoleDetached;
use Spatie\Permission\Events\PermissionAttached;
use Spatie\Permission\Events\PermissionDetached;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditPermissionsListener
{
    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $initiatorId = Auth::id();
        $ip = request()->ip();
        $userAgent = request()->userAgent();

        if ($event instanceof RoleAttached) {
            AuditLog::create([
                'user_id' => $initiatorId,
                'action' => 'role_change',
                'model_type' => get_class($event->model),
                'model_id' => $event->model->id,
                'new_values' => ['role' => $event->role->name],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
            ]);
        } elseif ($event instanceof RoleDetached) {
            AuditLog::create([
                'user_id' => $initiatorId,
                'action' => 'role_change',
                'model_type' => get_class($event->model),
                'model_id' => $event->model->id,
                'old_values' => ['role' => $event->role->name],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
            ]);
        } elseif ($event instanceof PermissionAttached) {
            AuditLog::create([
                'user_id' => $initiatorId,
                'action' => 'permission_change',
                'model_type' => get_class($event->model),
                'model_id' => $event->model->id,
                'new_values' => ['permission' => $event->permission->name],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
            ]);
        } elseif ($event instanceof PermissionDetached) {
            AuditLog::create([
                'user_id' => $initiatorId,
                'action' => 'permission_change',
                'model_type' => get_class($event->model),
                'model_id' => $event->model->id,
                'old_values' => ['permission' => $event->permission->name],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
            ]);
        }
    }
}
