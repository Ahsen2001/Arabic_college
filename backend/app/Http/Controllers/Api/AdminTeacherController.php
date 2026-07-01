<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use App\Models\UserQualification;
use App\Models\UserExperience;
use App\Models\LeaveRequest;
use App\Models\TimetableAllocation;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminTeacherController extends Controller
{
    /**
     * Display a listing of teachers with advanced filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::with(['user', 'department']);

        // Search query
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('teacher_id_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Department filter
        if ($request->has('department_id') && !empty($request->department_id)) {
            $query->where('department_id', $request->department_id);
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
            4 => 'Suspended',
        ];

        $designations = [
            1 => 'Professor',
            2 => 'Associate Professor',
            3 => 'Assistant Professor',
            4 => 'Lecturer',
            5 => 'Teaching Assistant',
        ];

        $items = collect($paginated->items())->map(function ($teacher) use ($statuses, $designations) {
            return [
                'id' => $teacher->id,
                'teacher_id_number' => $teacher->teacher_id_number,
                'name' => $teacher->user ? $teacher->user->name : 'N/A',
                'email' => $teacher->user ? $teacher->user->email : 'N/A',
                'department' => $teacher->department ? $teacher->department->translated_name : 'N/A',
                'designation_id' => $teacher->designation_id,
                'designation' => $designations[$teacher->designation_id] ?? 'Unknown',
                'status_id' => $teacher->status_id,
                'status' => $statuses[$teacher->status_id] ?? 'Unknown',
                'specialization' => $teacher->specialization,
                'joining_date' => $teacher->joining_date ? $teacher->joining_date->format('Y-m-d') : null,
            ];
        });

        return ApiResponse::success([
            'teachers' => $items,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
        ], 'Teachers directory retrieved.');
    }

    /**
     * Retrieve complete teacher dossier details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $teacher = Teacher::with([
            'user.qualifications',
            'user.experiences',
            'user.leaveRequests',
            'department',
            'courses.subject',
            'courses.timetableAllocations',
        ])->find($id);

        if (!$teacher) {
            return ApiResponse::error('Teacher profile not found.', 404);
        }

        $statuses = [
            1 => 'Active',
            2 => 'On Leave',
            3 => 'Resigned',
            4 => 'Suspended',
        ];

        $designations = [
            1 => 'Professor',
            2 => 'Associate Professor',
            3 => 'Assistant Professor',
            4 => 'Lecturer',
            5 => 'Teaching Assistant',
        ];

        // Format leaves log
        $leaves = $teacher->user?->leaveRequests->map(function ($lv) {
            return [
                'id' => $lv->id,
                'leave_type' => $lv->leave_type,
                'start_date' => $lv->start_date->format('Y-m-d'),
                'end_date' => $lv->end_date->format('Y-m-d'),
                'reason' => $lv->reason,
                'status' => $lv->status,
            ];
        }) ?: [];

        // Format courses and allocations
        $assignments = $teacher->courses->map(function ($c) {
            return [
                'course_id' => $c->id,
                'course_code' => $c->code,
                'section' => $c->section,
                'subject_name' => $c->subject ? $c->subject->translated_name : 'N/A',
                'schedules' => $c->timetableAllocations->map(function ($t) {
                    return [
                        'id' => $t->id,
                        'day_of_week' => $t->day_of_week,
                        'start_time' => $t->start_time,
                        'end_time' => $t->end_time,
                        'classroom' => $t->classroom,
                    ];
                }),
            ];
        });

        return ApiResponse::success([
            'id' => $teacher->id,
            'teacher_id_number' => $teacher->teacher_id_number,
            'name' => $teacher->user ? $teacher->user->name : 'N/A',
            'email' => $teacher->user ? $teacher->user->email : 'N/A',
            'phone' => $teacher->user ? $teacher->user->phone : 'N/A',
            'department_id' => $teacher->department_id,
            'department_name' => $teacher->department ? $teacher->department->translated_name : 'N/A',
            'designation_id' => $teacher->designation_id,
            'designation' => $designations[$teacher->designation_id] ?? 'Unknown',
            'status_id' => $teacher->status_id,
            'status' => $statuses[$teacher->status_id] ?? 'Unknown',
            'specialization' => $teacher->specialization,
            'joining_date' => $teacher->joining_date ? $teacher->joining_date->format('Y-m-d') : null,
            'qualifications' => $teacher->user?->qualifications ?: [],
            'experiences' => $teacher->user?->experiences ?: [],
            'leaves' => $leaves,
            'assignments' => $assignments,
        ], 'Teacher dossier profile retrieved.');
    }

    /**
     * Store new Teacher profile.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['required', 'string'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'designation_id' => ['required', 'integer', 'in:1,2,3,4,5'],
            'specialization' => ['nullable', 'string'],
            'joining_date' => ['required', 'date'],
        ]);

        DB::beginTransaction();
        try {
            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make('Teacher@College2026'),
                'status_id' => 1, // Active
            ]);

            // Assign Teacher Role
            $user->assignRole('Teacher');

            // Generate teacher code
            $year = date('Y');
            $random = rand(1000, 9999);
            $teacherIdNumber = "TEA{$year}{$random}";

            // Create profile
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'teacher_id_number' => $teacherIdNumber,
                'department_id' => $request->department_id,
                'designation_id' => $request->designation_id,
                'status_id' => 1, // Active
                'specialization' => $request->specialization,
                'joining_date' => $request->joining_date,
            ]);

            DB::commit();
            return ApiResponse::success([
                'teacher_id' => $teacher->id,
                'teacher_id_number' => $teacherIdNumber,
            ], 'Teacher account and profile created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to register teacher: ' . $e->getMessage());
        }
    }

    /**
     * Update Teacher profile parameters.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $teacher = Teacher::find($id);
        if (!$teacher) {
            return ApiResponse::error('Teacher records not found.', 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'designation_id' => ['required', 'integer', 'in:1,2,3,4,5'],
            'status_id' => ['required', 'integer', 'in:1,2,3,4'],
            'specialization' => ['nullable', 'string'],
            'joining_date' => ['required', 'date'],
        ]);

        DB::beginTransaction();
        try {
            if ($teacher->user) {
                $teacher->user->update([
                    'name' => $request->name,
                    'phone' => $request->phone,
                ]);
            }

            $teacher->update([
                'department_id' => $request->department_id,
                'designation_id' => $request->designation_id,
                'status_id' => $request->status_id,
                'specialization' => $request->specialization,
                'joining_date' => $request->joining_date,
            ]);

            DB::commit();
            return ApiResponse::success(null, 'Teacher profile updated.');
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
        $teacher = Teacher::find($id);
        if (!$teacher) {
            return ApiResponse::error('Teacher records not found.', 404);
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
            UserQualification::where('user_id', $teacher->user_id)->delete();

            foreach ($request->qualifications as $qual) {
                UserQualification::create([
                    'user_id' => $teacher->user_id,
                    'institution' => $qual['institution'],
                    'degree' => $qual['degree'],
                    'field_of_study' => $qual['field_of_study'],
                    'year_obtained' => $qual['year_obtained'],
                ]);
            }

            DB::commit();
            return ApiResponse::success(null, 'Teacher qualifications updated.');
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
        $teacher = Teacher::find($id);
        if (!$teacher) {
            return ApiResponse::error('Teacher records not found.', 404);
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
            UserExperience::where('user_id', $teacher->user_id)->delete();

            foreach ($request->experiences as $exp) {
                UserExperience::create([
                    'user_id' => $teacher->user_id,
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
     * Allocate or update Course Timetable schedules, running classroom conflict checks.
     */
    public function allocateTimetable(Request $request, $id): JsonResponse
    {
        $teacher = Teacher::find($id);
        if (!$teacher) {
            return ApiResponse::error('Teacher records not found.', 404);
        }

        $request->validate([
            'allocations' => ['required', 'array'],
            'allocations.*.course_id' => ['required', 'integer', 'exists:courses,id'],
            'allocations.*.day_of_week' => ['required', 'integer', 'min:1', 'max:7'],
            'allocations.*.start_time' => ['required', 'string'],
            'allocations.*.end_time' => ['required', 'string'],
            'allocations.*.classroom' => ['required', 'string', 'max:255'],
        ]);

        // Conflicts verification logic
        foreach ($request->allocations as $alloc) {
            $day = $alloc['day_of_week'];
            $start = $alloc['start_time'];
            $end = $alloc['end_time'];
            $room = $alloc['classroom'];
            $cId = $alloc['course_id'];

            // 1. Classroom booking conflict (classroom booked for same day, overlapping slots)
            $roomConflict = TimetableAllocation::where('classroom', $room)
                ->where('day_of_week', $day)
                ->where('course_id', '!=', $cId)
                ->where(function ($query) use ($start, $end) {
                    $query->whereBetween('start_time', [$start, $end])
                          ->orWhereBetween('end_time', [$start, $end])
                          ->orWhere(function ($q) use ($start, $end) {
                              $q->where('start_time', '<=', $start)
                                ->where('end_time', '>=', $end);
                          });
                })->first();

            if ($roomConflict) {
                return ApiResponse::error("Timetabling conflict: Classroom {$room} is already booked on this slot by course section ID {$roomConflict->course_id}.");
            }

            // 2. Teacher conflict (teacher scheduled elsewhere at overlapping time)
            $teacherConflict = TimetableAllocation::whereHas('course', function ($query) use ($teacher) {
                $query->where('teacher_id', $teacher->id);
            })
            ->where('day_of_week', $day)
            ->where('course_id', '!=', $cId)
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('start_time', [$start, $end])
                      ->orWhereBetween('end_time', [$start, $end])
                      ->orWhere(function ($q) use ($start, $end) {
                          $q->where('start_time', '<=', $start)
                            ->where('end_time', '>=', $end);
                      });
            })->first();

            if ($teacherConflict) {
                return ApiResponse::error("Timetabling conflict: The teacher is already scheduled for another course section on this day/slot.");
            }
        }

        DB::beginTransaction();
        try {
            // Sync allocations for courses selected
            $courseIds = collect($request->allocations)->pluck('course_id')->unique()->toArray();
            TimetableAllocation::whereIn('course_id', $courseIds)->delete();

            foreach ($request->allocations as $alloc) {
                TimetableAllocation::create([
                    'course_id' => $alloc['course_id'],
                    'day_of_week' => $alloc['day_of_week'],
                    'start_time' => $alloc['start_time'],
                    'end_time' => $alloc['end_time'],
                    'classroom' => $alloc['classroom'],
                ]);
            }

            DB::commit();
            return ApiResponse::success(null, 'Timetable slots allocated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Timetable allocation failed: ' . $e->getMessage());
        }
    }

    /**
     * Retrieve leaves index.
     */
    public function leaveIndex($id): JsonResponse
    {
        $teacher = Teacher::find($id);
        if (!$teacher) {
            return ApiResponse::error('Teacher record not found.', 404);
        }

        $leaves = LeaveRequest::where('user_id', $teacher->user_id)
            ->orderBy('start_date', 'desc')
            ->get();

        return ApiResponse::success($leaves, 'Teacher leave history logs retrieved.');
    }

    /**
     * Submit leave requests.
     */
    public function leaveStore(Request $request, $id): JsonResponse
    {
        $teacher = Teacher::find($id);
        if (!$teacher) {
            return ApiResponse::error('Teacher records not found.', 404);
        }

        $request->validate([
            'leave_type' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string'],
        ]);

        $leave = LeaveRequest::create([
            'user_id' => $teacher->user_id,
            'leave_type' => $request->leave_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'Pending',
        ]);

        return ApiResponse::success($leave, 'Leave request logged successfully.');
    }

    /**
     * Approve or reject leave logs.
     */
    public function leaveAction(Request $request, $leaveId): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:Approved,Rejected'],
        ]);

        $leave = LeaveRequest::find($leaveId);
        if (!$leave) {
            return ApiResponse::error('Leave request record not found.', 404);
        }

        $leave->update([
            'status' => $request->status,
            'approved_by_user_id' => $request->user()->id,
        ]);

        return ApiResponse::success($leave, "Leave request has been successfully {$request->status}.");
    }
}
