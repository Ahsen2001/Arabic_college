<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Display a listing of the audit logs with filters and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Authorization check
        $hasAccess = false;
        try {
            $hasAccess = $user->hasRole('Super Admin') || 
                         $user->hasRole('admin') || 
                         $user->hasPermissionTo('view audit logs') || 
                         $user->hasPermissionTo('view-audit-logs');
        } catch (\Exception $e) {
            // Fallback if role/permission tables are not fully set up
            $hasAccess = $user->email === 'admin@college.com' || str_contains(strtolower($user->name), 'admin');
        }

        if (!$hasAccess) {
            return ApiResponse::error('Unauthorized access to audit logs.', 403);
        }

        $query = AuditLog::with('user');

        // Search by user name/email, IP address, action, or model type
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('model_type', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        // Filter by user ID
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter by model type
        if ($request->filled('model_type')) {
            $query->where('model_type', $request->input('model_type'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->input('date_from') . ' 00:00:00');
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->input('date_to') . ' 23:59:59');
        }

        $perPage = $request->input('per_page', 15);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return ApiResponse::success($logs);
    }
}
