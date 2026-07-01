<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\LibraryBorrow;
use App\Models\StudentInvoice;
use App\Models\StudentSemesterGpa;
use App\Models\ExamResult;
use App\Models\StudentScholarship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    /**
     * Get student portal dashboard metrics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::with(['program', 'admissionSemester'])->where('user_id', $user->id)->first();

        if (!$student) {
            return ApiResponse::error('Student profile not found for this user.', 404);
        }

        // 1. Course Enrollments Count
        $enrollmentsCount = StudentCourseEnrollment::where('student_id', $student->id)->count();

        // 2. Library Borrows Count (unreturned books)
        $borrowedBooksCount = LibraryBorrow::where('user_id', $user->id)
            ->whereNull('return_date')
            ->count();

        // 3. Unpaid Financial Balance
        $unpaidBalance = StudentInvoice::where('student_id', $student->id)
            ->whereIn('status_id', [1, 2]) // Unpaid or Partially Paid
            ->sum('total_amount');

        // 4. Cumulative GPA Average
        $gpaAvg = StudentSemesterGpa::where('student_id', $student->id)->avg('gpa');
        $gpa = $gpaAvg ? round($gpaAvg, 2) : 0.00;

        return ApiResponse::success([
            'student_id' => $student->id,
            'student_id_number' => $student->student_id_number,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'program' => $student->program ? $student->program->translated_name : 'N/A',
            'admission_semester' => $student->admissionSemester ? $student->admissionSemester->name : 'N/A',
            'admission_date' => $student->admission_date ? $student->admission_date->format('Y-m-d') : null,
            'metrics' => [
                'enrollments_count' => $enrollmentsCount,
                'borrowed_books_count' => $borrowedBooksCount,
                'unpaid_balance' => round($unpaidBalance, 2),
                'gpa' => $gpa,
            ]
        ], 'Student dashboard metrics loaded.');
    }

    /**
     * Compile student dashboard academic milestones timeline feed.
     */
    public function timeline(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::with(['program'])->where('user_id', $user->id)->first();

        if (!$student) {
            return ApiResponse::error('Student profile not found.', 404);
        }

        $events = collect();

        // 1. Add Admission Date event
        if ($student->admission_date) {
            $events->push([
                'title' => 'Admission Enrolled',
                'description' => __('messages.matriculated_into') . " " . ($student->program ? $student->program->translated_name : __('messages.general')),
                'date' => $student->admission_date->format('Y-m-d'),
                'type' => 'academic',
            ]);
        }

        // 2. Add Course Enrollments events
        $enrollments = StudentCourseEnrollment::with('course.subject')
            ->where('student_id', $student->id)
            ->get();
        foreach ($enrollments as $enrollment) {
            $events->push([
                'title' => 'Course Enrolled',
                'description' => __('messages.registered_for') . " " . ($enrollment->course ? $enrollment->course->translated_name : 'Course Code ' . $enrollment->course_id),
                'date' => $enrollment->created_at->format('Y-m-d'),
                'type' => 'course',
            ]);
        }

        // 3. Add Exam Results events
        $examResults = ExamResult::with('examination')
            ->where('student_id', $student->id)
            ->get();
        foreach ($examResults as $result) {
            $events->push([
                'title' => 'Exam Graded',
                'description' => __('messages.scored_marks', ['marks' => $result->marks_obtained]) . " " . ($result->examination ? $result->examination->name : __('messages.examination')) . ".",
                'date' => $result->created_at->format('Y-m-d'),
                'type' => 'exam',
            ]);
        }

        // 4. Add Scholarships events
        $scholarships = StudentScholarship::where('student_id', $student->id)->get();
        foreach ($scholarships as $sch) {
            $events->push([
                'title' => 'Scholarship Awarded',
                'description' => "Received: {$sch->scholarship_name} granting a " . floatval($sch->discount_percentage) . "% tuition fee reduction.",
                'date' => $sch->award_date,
                'type' => 'financial',
            ]);
        }

        // Sort by date descending
        $sortedTimeline = $events->sortByDesc('date')->values()->all();

        return ApiResponse::success($sortedTimeline, 'Student timeline feed loaded.');
    }
}
