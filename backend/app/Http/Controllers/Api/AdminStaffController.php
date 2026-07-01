<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\User;
use App\Models\UserQualification;
use App\Models\UserExperience;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminStaffController extends Controller
{
    /**
     * Display a listing of staff with advanced filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Staff::with(['user', 'department']);

        // Search query
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('staff_id_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Role filter
        if ($request->has('staff_role_id') && !empty($request->staff_role_id)) {
            $query->where('staff_role_id', $request->staff_role_id);
        }

        // Status filter
        if ($request->has('status_id') && !empty($request->status_id)) {
            $query->where('status_id', $request->status_id);
        }

        $perPage = $request->input('per_page', 10);
        $paginated = $query->paginate($perPage);

        $statuses = [
            1 => 'Active',
            2 => 'On Leave',
            3 => 'Resigned',
        ];

        $roles = [
            1 => 'Administrator',
            2 => 'Accountant',
            3 => 'Librarian',
            4 => 'HR Officer',
            5 => 'IT Specialist',
            6 => 'Registrar',
        ];

        $items = collect($paginated->items())->map(function ($staff) use ($statuses, $roles) {
            return [
                'id' => $staff->id,
                'staff_id_number' => $staff->staff_id_number,
                'name' => $staff->user ? $staff->user->name : 'N/A',
                'email' => $staff->user ? $staff->user->email : 'N/A',
                'department' => $staff->department ? $staff->department->translated_name : 'N/A',
                'staff_role_id' => $staff->staff_role_id,
                'role' => $roles[$staff->staff_role_id] ?? 'Unknown',
                'status_id' => $staff->status_id,
                'status' => $statuses[$staff->status_id] ?? 'Unknown',
                'joining_date' => $staff->joining_date ? $staff->joining_date->format('Y-m-d') : null,
            ];
        });

        return ApiResponse::success([
            'staff' => $items,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
        ], 'Staff directory retrieved.');
    }

    /**
     * Retrieve complete staff dossier details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $staff = Staff::with([
            'user.qualifications',
            'user.experiences',
            'user.leaveRequests',
            'department',
        ])->find($id);

        if (!$staff) {
            return ApiResponse::error('Staff profile not found.', 404);
        }

        $statuses = [
            1 => 'Active',
            2 => 'On Leave',
            3 => 'Resigned',
        ];

        $roles = [
            1 => 'Administrator',
            2 => 'Accountant',
            3 => 'Librarian',
            4 => 'HR Officer',
            5 => 'IT Specialist',
            6 => 'Registrar',
        ];

        // Format leaves log
        $leaves = $staff->user?->leaveRequests->map(function ($lv) {
            return [
                'id' => $lv->id,
                'leave_type' => $lv->leave_type,
                'start_date' => $lv->start_date->format('Y-m-d'),
                'end_date' => $lv->end_date->format('Y-m-d'),
                'reason' => $lv->reason,
                'status' => $lv->status,
            ];
        }) ?: [];

        return ApiResponse::success([
            'id' => $staff->id,
            'staff_id_number' => $staff->staff_id_number,
            'name' => $staff->user ? $staff->user->name : 'N/A',
            'email' => $staff->user ? $staff->user->email : 'N/A',
            'phone' => $staff->user ? $staff->user->phone : 'N/A',
            'department_id' => $staff->department_id,
            'department_name' => $staff->department ? $staff->department->translated_name : 'N/A',
            'staff_role_id' => $staff->staff_role_id,
            'role' => $roles[$staff->staff_role_id] ?? 'Unknown',
            'status_id' => $staff->status_id,
            'status' => $statuses[$staff->status_id] ?? 'Unknown',
            'joining_date' => $staff->joining_date ? $staff->joining_date->format('Y-m-d') : null,
            'qualifications' => $staff->user?->qualifications ?: [],
            'experiences' => $staff->user?->experiences ?: [],
            'leaves' => $leaves,
        ], 'Staff dossier profile retrieved.');
    }

    /**
     * Store new Staff profile.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['required', 'string'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'staff_role_id' => ['required', 'integer', 'in:1,2,3,4,5,6'],
            'joining_date' => ['required', 'date'],
        ]);

        DB::beginTransaction();
        try {
            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make('Staff@College2026'),
                'status_id' => 1, // Active
            ]);

            // Assign Staff Role
            $user->assignRole('Staff');

            // Generate staff code
            $year = date('Y');
            $random = rand(1000, 9999);
            $staffIdNumber = "STF{$year}{$random}";

            // Create profile
            $staff = Staff::create([
                'user_id' => $user->id,
                'staff_id_number' => $staffIdNumber,
                'department_id' => $request->department_id,
                'staff_role_id' => $request->staff_role_id,
                'status_id' => 1, // Active
                'joining_date' => $request->joining_date,
            ]);

            DB::commit();
            return ApiResponse::success([
                'staff_id' => $staff->id,
                'staff_id_number' => $staffIdNumber,
            ], 'Staff account and profile created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to register staff member: ' . $e->getMessage());
        }
    }

    /**
     * Update Staff profile parameters.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $staff = Staff::find($id);
        if (!$staff) {
            return ApiResponse::error('Staff records not found.', 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'staff_role_id' => ['required', 'integer', 'in:1,2,3,4,5,6'],
            'status_id' => ['required', 'integer', 'in:1,2,3'],
            'joining_date' => ['required', 'date'],
        ]);

        DB::beginTransaction();
        try {
            if ($staff->user) {
                $staff->user->update([
                    'name' => $request->name,
                    'phone' => $request->phone,
                ]);
            }

            $staff->update([
                'department_id' => $request->department_id,
                'staff_role_id' => $request->staff_role_id,
                'status_id' => $request->status_id,
                'joining_date' => $request->joining_date,
            ]);

            DB::commit();
            return ApiResponse::success(null, 'Staff profile updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Update failed: ' . $e->getMessage());
        }
    }

    /**
     * Update Qualifications.
     */
    public function updateQualifications(Request $request, $id): JsonResponse
    {
        $staff = Staff::find($id);
        if (!$staff) {
            return ApiResponse::error('Staff records not found.', 404);
        }

        $request->validate([
            'qualifications' => ['required', 'array'],
            'qualifications.*.institution' => ['required', 'string', 'max:255'],
            'qualifications.*.degree' => ['required', 'string', 'max:255'],
            'qualifications.*.field_of_study' => ['required', 'string', 'max:255'],
            'qualifications.*.year_obtained' => ['required', 'integer'],
        ]);

        DB::beginTransaction();
        try {
            UserQualification::where('user_id', $staff->user_id)->delete();

            foreach ($request->qualifications as $qual) {
                UserQualification::create([
                    'user_id' => $staff->user_id,
                    'institution' => $qual['institution'],
                    'degree' => $qual['degree'],
                    'field_of_study' => $qual['field_of_study'],
                    'year_obtained' => $qual['year_obtained'],
                ]);
            }

            DB::commit();
            return ApiResponse::success(null, 'Staff qualifications updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to save qualifications: ' . $e->getMessage());
        }
    }

    /**
     * Update Experiences.
     */
    public function updateExperience(Request $request, $id): JsonResponse
    {
        $staff = Staff::find($id);
        if (!$staff) {
            return ApiResponse::error('Staff records not found.', 404);
        }

        $request->validate([
            'experiences' => ['required', 'array'],
            'experiences.*.company_name' => ['required', 'string', 'max:255'],
            'experiences.*.job_title' => ['required', 'string', 'max:255'],
            'experiences.*.start_date' => ['required', 'date'],
            'experiences.*.end_date' => ['nullable', 'date'],
            'experiences.*.description' => ['nullable', 'string'],
        ]);

        DB::beginTransaction();
        try {
            UserExperience::where('user_id', $staff->user_id)->delete();

            foreach ($request->experiences as $exp) {
                UserExperience::create([
                    'user_id' => $staff->user_id,
                    'company_name' => $exp['company_name'],
                    'job_title' => $exp['job_title'],
                    'start_date' => $exp['start_date'],
                    'end_date' => $exp['end_date'] ?? null,
                    'description' => $exp['description'] ?? null,
                ]);
            }

            DB::commit();
            return ApiResponse::success(null, 'Work experience histories updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to update experience: ' . $e->getMessage());
        }
    }

    /**
     * Retrieve leaves index.
     */
    public function leaveIndex($id): JsonResponse
    {
        $staff = Staff::find($id);
        if (!$staff) {
            return ApiResponse::error('Staff record not found.', 404);
        }

        $leaves = LeaveRequest::where('user_id', $staff->user_id)
            ->orderBy('start_date', 'desc')
            ->get();

        return ApiResponse::success($leaves, 'Staff leave history logs retrieved.');
    }

    /**
     * Submit leave requests.
     */
    public function leaveStore(Request $request, $id): JsonResponse
    {
        $staff = Staff::find($id);
        if (!$staff) {
            return ApiResponse::error('Staff records not found.', 404);
        }

        $request->validate([
            'leave_type' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string'],
        ]);

        $leave = LeaveRequest::create([
            'user_id' => $staff->user_id,
            'leave_type' => $request->leave_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'Pending',
        ]);

        return ApiResponse::success($leave, 'Leave request logged successfully.');
    }
}
