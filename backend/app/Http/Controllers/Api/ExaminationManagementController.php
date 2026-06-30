<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Examination;
use App\Models\ExamResult;
use App\Models\ExamRecheckRequest;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExaminationManagementController extends Controller
{
    // =========================================================================
    // EXAM SCHEDULES
    // =========================================================================

    public function getSchedules(Request $request): JsonResponse
    {
        $exams = Examination::with(['course.subject', 'course.semester'])->orderBy('exam_date')->get();
        return ApiResponse::success($exams, 'Exam schedules loaded.');
    }

    public function storeSchedule(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'exam_type_id' => ['required', 'integer', 'exists:exam_types,id'],
            'name' => ['required', 'string', 'max:255'],
            'exam_date' => ['required', 'date'],
            'max_marks' => ['required', 'numeric', 'min:1'],
            'weightage_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $exam = Examination::create([
            'course_id' => $request->course_id,
            'exam_type_id' => $request->exam_type_id,
            'name' => $request->name,
            'exam_date' => $request->exam_date,
            'max_marks' => $request->max_marks,
            'weightage_percentage' => $request->weightage_percentage,
            'is_published' => false,
        ]);

        return ApiResponse::success($exam, 'Exam schedule created successfully.');
    }

    // =========================================================================
    // MARKS ENTRY & GRADE CALCULATION
    // =========================================================================

    public function getMarks($examId): JsonResponse
    {
        $exam = Examination::with(['course.subject', 'course.semester'])->find($examId);
        if (!$exam) {
            return ApiResponse::error('Exam schedule not found.', 404);
        }

        // Get enrolled students
        $enrollments = StudentCourseEnrollment::with('student.user')
            ->where('course_id', $exam->course_id)
            ->where('status_id', 1)
            ->get();

        // Get saved marks
        $results = ExamResult::where('examination_id', $examId)->get()->keyBy('student_id');

        $records = $enrollments->map(function ($enr) use ($results) {
            $student = $enr->student;
            $res = $results->get($student->id);

            return [
                'result_id' => $res ? $res->id : null,
                'student_id' => $student->id,
                'student_id_number' => $student->student_id_number,
                'name' => $student->user ? $student->user->name : 'N/A',
                'marks_obtained' => $res ? (float)$res->marks_obtained : 0.00,
                'grade_id' => $res ? $res->grade_id : null,
                'remarks' => $res ? $res->remarks : '',
            ];
        });

        return ApiResponse::success([
            'exam' => $exam,
            'records' => $records
        ], 'Exam marks sheet loaded.');
    }

    public function saveMarks(Request $request, $examId): JsonResponse
    {
        $request->validate([
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'records.*.marks_obtained' => ['required', 'numeric', 'min:0'],
            'records.*.remarks' => ['nullable', 'string'],
        ]);

        $exam = Examination::find($examId);
        if (!$exam) {
            return ApiResponse::error('Exam schedule not found.', 404);
        }

        $grades = DB::table('grades')->orderBy('min_score', 'desc')->get();

        DB::beginTransaction();
        try {
            foreach ($request->records as $rec) {
                $percentage = ($rec['marks_obtained'] / $exam->max_marks) * 100;
                
                // Find matching letter grade
                $gradeId = 8; // Default F
                foreach ($grades as $g) {
                    if ($percentage >= $g->min_score && $percentage <= $g->max_score) {
                        $gradeId = $g->id;
                        break;
                    }
                }

                ExamResult::updateOrCreate(
                    [
                        'examination_id' => $examId,
                        'student_id' => $rec['student_id'],
                    ],
                    [
                        'marks_obtained' => $rec['marks_obtained'],
                        'grade_id' => $gradeId,
                        'remarks' => $rec['remarks'] ?? null,
                        'graded_by_user_id' => $request->user()->id,
                    ]
                );
            }
            DB::commit();
            return ApiResponse::success(null, 'Marks logs saved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Transaction failed: ' . $e->getMessage());
        }
    }

    // =========================================================================
    // RESULTS PUBLISHING & COHORT RANKINGS
    // =========================================================================

    public function publishResults(Request $request, $examId): JsonResponse
    {
        $exam = Examination::find($examId);
        if (!$exam) {
            return ApiResponse::error('Exam not found.', 404);
        }

        $exam->update([
            'is_published' => $request->input('is_published', true)
        ]);

        $status = $exam->is_published ? 'published' : 'unpublished';
        return ApiResponse::success(null, "Results status set to {$status}.");
    }

    public function getRankings(Request $request): JsonResponse
    {
        $programId = $request->input('program_id');

        // Fetch students and calculate cumulative GPA average ranks
        $query = Student::with(['user', 'program', 'semesterGpas']);
        if ($programId) {
            $query->where('program_id', $programId);
        }

        $students = $query->get();

        $ranked = $students->map(function ($student) {
            $cgpa = $student->semesterGpas->avg('gpa') ?: 0.00;
            return [
                'student_id' => $student->id,
                'student_id_number' => $student->student_id_number,
                'name' => $student->user ? $student->user->name : 'N/A',
                'program' => $student->program ? $student->program->code : 'N/A',
                'cgpa' => round($cgpa, 2),
            ];
        })
        ->sortByDesc('cgpa')
        ->values();

        // Assign ordinal ranks
        $ranked = $ranked->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });

        return ApiResponse::success($ranked, 'Cohort ranks computed.');
    }

    // =========================================================================
    // RECHECKING REQUESTS
    // =========================================================================

    public function getRecheckRequests(Request $request): JsonResponse
    {
        $requests = ExamRecheckRequest::with(['student.user', 'examResult.examination.course.subject'])
            ->orderBy('created_at', 'desc')
            ->get();

        return ApiResponse::success($requests, 'Recheck logs loaded.');
    }

    public function fileRecheckRequest(Request $request, $resultId): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string'],
        ]);

        $result = ExamResult::find($resultId);
        if (!$result) {
            return ApiResponse::error('Exam result record not found.', 404);
        }

        // Fetch student profile linked to user
        $student = Student::where('user_id', $request->user()->id)->first();
        if (!$student) {
            return ApiResponse::error('Only students can file rechecking requests.', 403);
        }

        $recheck = ExamRecheckRequest::create([
            'exam_result_id' => $resultId,
            'student_id' => $student->id,
            'reason' => $request->reason,
            'status' => 'Pending',
        ]);

        return ApiResponse::success($recheck, 'Recheck request registered.');
    }

    public function actionRecheckRequest(Request $request, $recheckId): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:Approved,Rejected'],
            'new_marks' => ['nullable', 'numeric', 'min:0'],
            'teacher_remarks' => ['nullable', 'string'],
        ]);

        $recheck = ExamRecheckRequest::with('examResult.examination')->find($recheckId);
        if (!$recheck) {
            return ApiResponse::error('Recheck request not found.', 404);
        }

        DB::beginTransaction();
        try {
            $recheck->update([
                'status' => $request->status,
                'new_marks' => $request->new_marks,
                'teacher_remarks' => $request->teacher_remarks,
            ]);

            if ($request->status === 'Approved' && $request->new_marks !== null) {
                // Update final exam result marks and recalculate grade!
                $result = $recheck->examResult;
                $exam = $result->examination;

                $percentage = ($request->new_marks / $exam->max_marks) * 100;
                $grades = DB::table('grades')->orderBy('min_score', 'desc')->get();

                $gradeId = 8; // Default F
                foreach ($grades as $g) {
                    if ($percentage >= $g->min_score && $percentage <= $g->max_score) {
                        $gradeId = $g->id;
                        break;
                    }
                }

                $result->update([
                    'marks_obtained' => $request->new_marks,
                    'grade_id' => $gradeId,
                ]);
            }

            DB::commit();
            return ApiResponse::success($recheck, "Recheck request marked {$request->status}.");
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to log recheck action: ' . $e->getMessage());
        }
    }

    // =========================================================================
    // PERFORMANCE ANALYTICS
    // =========================================================================

    public function getAnalytics(): JsonResponse
    {
        // 1. Success rate (percentage scoring >=60% in final exams)
        $total = ExamResult::count();
        $passed = ExamResult::join('grades', 'exam_results.grade_id', '=', 'grades.id')
            ->where('grades.letter_grade', '!=', 'F')
            ->count();

        $successRate = $total > 0 ? round(($passed / $total) * 100, 1) : 100;

        // 2. Average exam marks by type
        $avgScores = DB::table('exam_results')
            ->join('examinations', 'exam_results.examination_id', '=', 'examinations.id')
            ->join('exam_types', 'examinations.exam_type_id', '=', 'exam_types.id')
            ->select('exam_types.name', DB::raw('round(avg(exam_results.marks_obtained), 2) as avg_marks'))
            ->groupBy('exam_types.name')
            ->pluck('avg_marks', 'name');

        return ApiResponse::success([
            'success_rate' => $successRate,
            'avg_scores' => $avgScores
        ], 'Cohort exam reports compiled.');
    }
}
