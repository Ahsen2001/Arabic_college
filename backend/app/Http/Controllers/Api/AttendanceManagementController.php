<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\Course;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentAttendance;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceManagementController extends Controller
{
    // =========================================================================
    // STUDENT ATTENDANCE
    // =========================================================================

    public function getStudentAttendance(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'date' => ['required', 'date'],
        ]);

        $courseId = $request->course_id;
        $date = $request->date;

        // Fetch students enrolled
        $enrollments = StudentCourseEnrollment::with('student.user')
            ->where('course_id', $courseId)
            ->where('status_id', 1)
            ->get();

        // Fetch logs
        $existing = StudentAttendance::where('course_id', $courseId)
            ->where('attendance_date', $date)
            ->get()
            ->keyBy('student_id');

        $records = $enrollments->map(function ($enr) use ($existing) {
            $student = $enr->student;
            $att = $existing->get($student->id);

            return [
                'student_id' => $student->id,
                'student_id_number' => $student->student_id_number,
                'name' => $student->user ? $student->user->name : 'N/A',
                'status_id' => $att ? $att->status_id : 1, // Default Present
                'remarks' => $att ? $att->remarks : '',
            ];
        });

        return ApiResponse::success([
            'date' => $date,
            'records' => $records
        ], 'Student attendance logs loaded.');
    }

    public function saveStudentAttendanceBulk(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'date' => ['required', 'date'],
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'records.*.status_id' => ['required', 'integer', 'in:1,2,3,4'],
            'records.*.remarks' => ['nullable', 'string'],
        ]);

        $courseId = $request->course_id;
        $date = $request->date;

        DB::beginTransaction();
        try {
            foreach ($request->records as $rec) {
                StudentAttendance::updateOrCreate(
                    [
                        'student_id' => $rec['student_id'],
                        'course_id' => $courseId,
                        'attendance_date' => $date,
                    ],
                    [
                        'status_id' => $rec['status_id'],
                        'remarks' => $rec['remarks'] ?? null,
                        'marked_by_user_id' => $request->user()->id,
                    ]
                );
            }
            DB::commit();
            return ApiResponse::success(null, 'Student bulk attendance saved.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Transaction failed: ' . $e->getMessage());
        }
    }

    public function markQRStudentAttendance(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'student_id_number' => ['required', 'string'],
        ]);

        $student = Student::where('student_id_number', $request->student_id_number)->first();
        if (!$student) {
            return ApiResponse::error('Student registration code not found.', 404);
        }

        // Verify enrollment
        $isEnrolled = StudentCourseEnrollment::where('student_id', $student->id)
            ->where('course_id', $request->course_id)
            ->exists();

        if (!$isEnrolled) {
            return ApiResponse::error('Student is not enrolled in this section.', 400);
        }

        $date = date('Y-m-d');
        $timeStr = date('h:i A');

        $att = StudentAttendance::updateOrCreate(
            [
                'student_id' => $student->id,
                'course_id' => $request->course_id,
                'attendance_date' => $date,
            ],
            [
                'status_id' => 1, // Present
                'remarks' => "QR Checked-in at {$timeStr}",
                'marked_by_user_id' => $request->user()->id,
            ]
        );

        return ApiResponse::success($att, "Student {$student->student_id_number} marked present via QR.");
    }

    // =========================================================================
    // STAFF & TEACHER ATTENDANCE
    // =========================================================================

    public function getStaffAttendance(Request $request): JsonResponse
    {
        $date = $request->input('date', date('Y-m-d'));

        // Fetch all teachers and staff users
        $users = User::role(['Teacher', 'Staff'])->get();

        $existing = DB::table('staff_attendance')
            ->where('attendance_date', $date)
            ->get()
            ->keyBy('user_id');

        $records = $users->map(function ($u) use ($existing) {
            $att = $existing->get($u->id);

            return [
                'user_id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'status_id' => $att ? $att->status_id : 1, // Default Present
                'clock_in' => $att ? $att->clock_in : null,
                'clock_out' => $att ? $att->clock_out : null,
                'remarks' => $att ? $att->remarks : '',
            ];
        });

        return ApiResponse::success([
            'date' => $date,
            'records' => $records
        ], 'Staff attendance list compiled.');
    }

    public function saveStaffAttendanceBulk(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'records' => ['required', 'array'],
            'records.*.user_id' => ['required', 'integer', 'exists:users,id'],
            'records.*.status_id' => ['required', 'integer', 'in:1,2,3,4'],
            'records.*.clock_in' => ['nullable', 'string'],
            'records.*.clock_out' => ['nullable', 'string'],
            'records.*.remarks' => ['nullable', 'string'],
        ]);

        $date = $request->date;

        DB::beginTransaction();
        try {
            foreach ($request->records as $rec) {
                DB::table('staff_attendance')->updateOrInsert(
                    [
                        'user_id' => $rec['user_id'],
                        'attendance_date' => $date,
                    ],
                    [
                        'status_id' => $rec['status_id'],
                        'clock_in' => $rec['clock_in'] ?: null,
                        'clock_out' => $rec['clock_out'] ?: null,
                        'remarks' => $rec['remarks'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
            DB::commit();
            return ApiResponse::success(null, 'Staff bulk attendance register updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Transaction failed: ' . $e->getMessage());
        }
    }

    public function markQRStaffAttendance(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::role(['Teacher', 'Staff'])->where('email', $request->email)->first();
        if (!$user) {
            return ApiResponse::error('Staff profile not registered.', 404);
        }

        $date = date('Y-m-d');
        $timeStr = date('H:i:s');

        // Check if log already exists
        $existing = DB::table('staff_attendance')
            ->where('user_id', $user->id)
            ->where('attendance_date', $date)
            ->first();

        if (!$existing) {
            // First check-in: Clock-in
            DB::table('staff_attendance')->insert([
                'user_id' => $user->id,
                'attendance_date' => $date,
                'clock_in' => $timeStr,
                'status_id' => 1,
                'remarks' => 'QR Check-in',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return ApiResponse::success(null, "Staff member {$user->name} clocked in at {$timeStr}.");
        } else {
            // Second check-in: Clock-out
            DB::table('staff_attendance')
                ->where('user_id', $user->id)
                ->where('attendance_date', $date)
                ->update([
                    'clock_out' => $timeStr,
                    'remarks' => 'QR Check-out completed.',
                    'updated_at' => now(),
                ]);
            return ApiResponse::success(null, "Staff member {$user->name} clocked out at {$timeStr}.");
        }
    }

    // =========================================================================
    // LEAVE REQUESTS
    // =========================================================================

    public function getLeaveRequests(Request $request): JsonResponse
    {
        $status = $request->input('status');

        $query = LeaveRequest::with('user');
        if ($status) {
            $query->where('status', $status);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();
        return ApiResponse::success($requests, 'Leave requests ledger compiled.');
    }

    public function storeLeaveRequest(Request $request): JsonResponse
    {
        $request->validate([
            'leave_type' => ['required', 'string', 'max:255'], // Sick, Casual, Annual
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string'],
        ]);

        $leave = LeaveRequest::create([
            'user_id' => $request->user()->id,
            'leave_type' => $request->leave_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'Pending',
        ]);

        return ApiResponse::success($leave, 'Leave request filed successfully.');
    }

    public function approveLeaveRequest(Request $request, $leaveId): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:Approved,Rejected'],
        ]);

        $leave = LeaveRequest::find($leaveId);
        if (!$leave) {
            return ApiResponse::error('Leave request not found.', 404);
        }

        $leave->update([
            'status' => $request->status,
            'approved_by_user_id' => $request->user()->id,
        ]);

        return ApiResponse::success($leave, "Leave request marked {$request->status}.");
    }

    // =========================================================================
    // ATTENDANCE REPORT & COHORT ANALYTICS
    // =========================================================================

    public function getAttendanceAnalytics(): JsonResponse
    {
        $today = date('Y-m-d');

        // 1. Today's student attendance rate
        $studentTotal = StudentAttendance::where('attendance_date', $today)->count();
        $studentPresent = StudentAttendance::where('attendance_date', $today)->where('status_id', 1)->count();
        $studentRate = $studentTotal > 0 ? round(($studentPresent / $studentTotal) * 100, 1) : 100;

        // 2. Today's staff attendance rate
        $staffTotal = DB::table('staff_attendance')->where('attendance_date', $today)->count();
        $staffPresent = DB::table('staff_attendance')->where('attendance_date', $today)->where('status_id', 1)->count();
        $staffRate = $staffTotal > 0 ? round(($staffPresent / $staffTotal) * 100, 1) : 100;

        // 3. Pending leave requests count
        $pendingLeaves = LeaveRequest::where('status', 'Pending')->count();

        // 4. Student monthly distribution rates (present, absent, late, excused)
        $dist = DB::table('student_attendance')
            ->select('status_id', DB::raw('count(id) as total'))
            ->groupBy('status_id')
            ->pluck('total', 'status_id');

        $distribution = [
            'Present' => $dist->get(1, 0),
            'Absent' => $dist->get(2, 0),
            'Late' => $dist->get(3, 0),
            'Excused' => $dist->get(4, 0),
        ];

        return ApiResponse::success([
            'today_student_rate' => $studentRate,
            'today_staff_rate' => $staffRate,
            'pending_leaves' => $pendingLeaves,
            'distribution' => $distribution,
        ], 'Attendance analytics report compiled.');
    }
}
