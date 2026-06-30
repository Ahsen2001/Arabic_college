<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentAttendance;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Examination;
use App\Models\ExamResult;
use App\Models\StudentSemesterGpa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShareeaAcademicController extends Controller
{
    // =========================================================================
    // ATTENDANCE
    // =========================================================================

    public function getAttendance(Request $request, $courseId): JsonResponse
    {
        $course = Course::find($courseId);
        if (!$course) {
            return ApiResponse::error('Course section not found.', 404);
        }

        $date = $request->input('date', date('Y-m-d'));

        // Fetch students enrolled in this course
        $enrollments = StudentCourseEnrollment::with('student.user')
            ->where('course_id', $courseId)
            ->where('status_id', 1) // Active
            ->get();

        // Fetch existing attendance logs
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
                'status_id' => $att ? $att->status_id : 1, // default present
                'remarks' => $att ? $att->remarks : '',
            ];
        });

        return ApiResponse::success([
            'date' => $date,
            'records' => $records,
        ], 'Attendance sheet compiled.');
    }

    public function markAttendance(Request $request, $courseId): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'records.*.status_id' => ['required', 'integer', 'in:1,2,3,4'], // Present, Absent, Late, Excused
            'records.*.remarks' => ['nullable', 'string'],
        ]);

        $date = $request->date;

        DB::beginTransaction();
        try {
            foreach ($request->records as $rec) {
                StudentAttendance::updateOrCreate(
                    [
                        'course_id' => $courseId,
                        'student_id' => $rec['student_id'],
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
            return ApiResponse::success(null, 'Attendance logged successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to log attendance: ' . $e->getMessage());
        }
    }

    // =========================================================================
    // ASSIGNMENTS
    // =========================================================================

    public function getAssignments($courseId): JsonResponse
    {
        $assignments = Assignment::where('course_id', $courseId)->orderBy('due_date')->get();
        return ApiResponse::success($assignments, 'Course assignments retrieved.');
    }

    public function storeAssignment(Request $request, $courseId): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'max_marks' => ['required', 'numeric', 'min:1'],
            'due_date' => ['required', 'date'],
        ]);

        $assignment = Assignment::create([
            'course_id' => $courseId,
            'title' => $request->title,
            'description' => $request->description,
            'max_marks' => $request->max_marks,
            'due_date' => $request->due_date,
        ]);

        return ApiResponse::success($assignment, 'Assignment created successfully.');
    }

    public function getSubmissions($assignmentId): JsonResponse
    {
        $assignment = Assignment::find($assignmentId);
        if (!$assignment) {
            return ApiResponse::error('Assignment not found.', 404);
        }

        // List students and their submissions
        $courseId = $assignment->course_id;
        $enrollments = StudentCourseEnrollment::with('student.user')
            ->where('course_id', $courseId)
            ->where('status_id', 1)
            ->get();

        $submissions = AssignmentSubmission::where('assignment_id', $assignmentId)
            ->get()
            ->keyBy('student_id');

        $records = $enrollments->map(function ($enr) use ($submissions, $assignmentId) {
            $student = $enr->student;
            $sub = $submissions->get($student->id);

            return [
                'submission_id' => $sub ? $sub->id : null,
                'student_id' => $student->id,
                'student_id_number' => $student->student_id_number,
                'name' => $student->user ? $student->user->name : 'N/A',
                'file_path' => $sub ? $sub->file_path : null,
                'submitted_at' => $sub ? $sub->submitted_at->format('Y-m-d H:i:s') : null,
                'marks_obtained' => $sub ? $sub->marks_obtained : null,
                'feedback' => $sub ? $sub->feedback : '',
                'max_marks' => $sub ? null : null, // placeholder
            ];
        });

        return ApiResponse::success([
            'assignment_title' => $assignment->title,
            'max_marks' => $assignment->max_marks,
            'records' => $records,
        ], 'Assignment submission register retrieved.');
    }

    public function gradeSubmission(Request $request, $assignmentId): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'marks_obtained' => ['required', 'numeric', 'min:0'],
            'feedback' => ['nullable', 'string'],
        ]);

        $sub = AssignmentSubmission::updateOrCreate(
            [
                'assignment_id' => $assignmentId,
                'student_id' => $request->student_id,
            ],
            [
                'marks_obtained' => $request->marks_obtained,
                'feedback' => $request->feedback,
                'submitted_at' => now(),
            ]
        );

        return ApiResponse::success($sub, 'Submission graded.');
    }

    // =========================================================================
    // GRADEBOOK (MARKS & GRADING)
    // =========================================================================

    public function getGradebook($courseId): JsonResponse
    {
        $course = Course::find($courseId);
        if (!$course) {
            return ApiResponse::error('Course section not found.', 404);
        }

        // Fetch students
        $enrollments = StudentCourseEnrollment::with('student.user')
            ->where('course_id', $courseId)
            ->where('status_id', 1)
            ->get();

        // Fetch Midterm and Final exam records for this course
        $midtermExam = Examination::where('course_id', $courseId)->where('exam_type_id', 2)->first();
        $finalExam = Examination::where('course_id', $courseId)->where('exam_type_id', 3)->first();

        $midtermResults = $midtermExam ? ExamResult::where('examination_id', $midtermExam->id)->get()->keyBy('student_id') : collect();
        $finalResults = $finalExam ? ExamResult::where('examination_id', $finalExam->id)->get()->keyBy('student_id') : collect();

        // Average assignment scores per student
        $assignmentScores = AssignmentSubmission::whereHas('assignment', function ($q) use ($courseId) {
            $q->where('course_id', $courseId);
        })
        ->get()
        ->groupBy('student_id');

        $grades = DB::table('grades')->orderBy('min_score', 'desc')->get();

        $records = $enrollments->map(function ($enr) use ($midtermResults, $finalResults, $assignmentScores, $grades) {
            $student = $enr->student;
            
            // Midterm score
            $midResult = $midtermResults->get($student->id);
            $midMarks = $midResult ? (float)$midResult->marks_obtained : 0.00;

            // Final exam score
            $finResult = $finalResults->get($student->id);
            $finMarks = $finResult ? (float)$finResult->marks_obtained : 0.00;

            // Assignment average score
            $stSubmissions = $assignmentScores->get($student->id) ?: collect();
            $assignTotal = 0;
            if ($stSubmissions->count() > 0) {
                $assignTotal = $stSubmissions->avg('marks_obtained');
            }

            // Standard final calculations (Weight: Midterm 30%, Assignments 30%, Final 40%)
            // Let's assume midterm and final exams were out of 100 in terms of percentage.
            $finalScore = ($midMarks * 0.3) + ($assignTotal * 0.3) + ($finMarks * 0.4);

            // Find matching letter grade
            $letterGrade = 'F';
            $gradeId = 8; // F ID
            foreach ($grades as $g) {
                if ($finalScore >= $g->min_score && $finalScore <= $g->max_score) {
                    $letterGrade = $g->letter_grade;
                    $gradeId = $g->id;
                    break;
                }
            }

            return [
                'student_id' => $student->id,
                'student_id_number' => $student->student_id_number,
                'name' => $student->user ? $student->user->name : 'N/A',
                'midterm_marks' => $midMarks,
                'assignment_avg' => $assignTotal,
                'final_exam_marks' => $finMarks,
                'final_score' => round($finalScore, 2),
                'grade_id' => $gradeId,
                'letter_grade' => $letterGrade,
            ];
        });

        return ApiResponse::success([
            'records' => $records,
        ], 'Gradebook logs retrieved.');
    }

    public function saveGradebook(Request $request, $courseId): JsonResponse
    {
        $request->validate([
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'records.*.midterm_marks' => ['required', 'numeric', 'min:0', 'max:100'],
            'records.*.final_exam_marks' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::beginTransaction();
        try {
            // Get or create examinations
            $midtermExam = Examination::firstOrCreate(
                ['course_id' => $courseId, 'exam_type_id' => 2],
                ['name' => 'Midterm Evaluation', 'exam_date' => now(), 'max_marks' => 100, 'weightage_percentage' => 30]
            );

            $finalExam = Examination::firstOrCreate(
                ['course_id' => $courseId, 'exam_type_id' => 3],
                ['name' => 'Final Exam', 'exam_date' => now(), 'max_marks' => 100, 'weightage_percentage' => 40]
            );

            // Fetch grades table
            $grades = DB::table('grades')->orderBy('min_score', 'desc')->get();

            foreach ($request->records as $rec) {
                $studentId = $rec['student_id'];
                $mid = $rec['midterm_marks'];
                $fin = $rec['final_exam_marks'];

                // Calculate final letter grade
                // Assignments average score
                $assignAvg = AssignmentSubmission::whereHas('assignment', function ($q) use ($courseId) {
                    $q->where('course_id', $courseId);
                })
                ->where('student_id', $studentId)
                ->avg('marks_obtained') ?: 0.00;

                $finalScore = ($mid * 0.3) + ($assignAvg * 0.3) + ($fin * 0.4);

                $gradeId = 8; // Default F
                foreach ($grades as $g) {
                    if ($finalScore >= $g->min_score && $finalScore <= $g->max_score) {
                        $gradeId = $g->id;
                        break;
                    }
                }

                // 1. Midterm Result
                ExamResult::updateOrCreate(
                    ['examination_id' => $midtermExam->id, 'student_id' => $studentId],
                    ['marks_obtained' => $mid, 'graded_by_user_id' => $request->user()->id]
                );

                // 2. Final Result
                ExamResult::updateOrCreate(
                    ['examination_id' => $finalExam->id, 'student_id' => $studentId],
                    ['marks_obtained' => $fin, 'grade_id' => $gradeId, 'graded_by_user_id' => $request->user()->id]
                );
            }

            DB::commit();
            return ApiResponse::success(null, 'Grades locked successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to log gradebook: ' . $e->getMessage());
        }
    }

    // =========================================================================
    // TRANSCRIPTS & GPAs
    // =========================================================================

    public function getTranscript($studentId): JsonResponse
    {
        $student = Student::with(['user', 'program'])->find($studentId);
        if (!$student) {
            return ApiResponse::error('Student profile not found.', 404);
        }

        // Fetch all course enrollments with exams & subjects
        $enrollments = StudentCourseEnrollment::with(['course.subject', 'course.semester'])
            ->where('student_id', $studentId)
            ->get();

        // Get final exams results
        $finalExams = Examination::whereIn('course_id', $enrollments->pluck('course_id'))->where('exam_type_id', 3)->pluck('id');
        $finalResults = ExamResult::with('grade')->whereIn('examination_id', $finalExams)->where('student_id', $studentId)->get()->keyBy('examination_id');

        $grades = DB::table('grades')->get()->keyBy('id');

        // Group enrollments by semester
        $semesters = $enrollments->groupBy('course.semester_id');

        $transcriptList = [];
        $totalCreditsAttempted = 0;
        $totalCreditsEarned = 0;
        $totalGradePoints = 0.00;

        foreach ($semesters as $semId => $semEnrollments) {
            $semCode = '';
            $semName = '';
            $semCreditsAttempted = 0;
            $semCreditsEarned = 0;
            $semGradePoints = 0.00;
            $courseList = [];

            foreach ($semEnrollments as $enr) {
                $course = $enr->course;
                $subject = $course->subject;
                $semCode = $course->semester->code;
                $semName = $course->semester->name;

                // Find exam final marks
                $exam = Examination::where('course_id', $course->id)->where('exam_type_id', 3)->first();
                $res = $exam ? $finalResults->get($exam->id) : null;

                $letterGrade = 'N/A';
                $gpaVal = 0.00;
                $credits = $subject ? $subject->credit_hours : 0;

                if ($res) {
                    $gradeItem = $res->grade;
                    if ($gradeItem) {
                        $letterGrade = $gradeItem->letter_grade;
                        $gpaVal = (float)$gradeItem->gpa_value;
                    }
                }

                $semCreditsAttempted += $credits;
                if ($letterGrade !== 'F' && $letterGrade !== 'N/A') {
                    $semCreditsEarned += $credits;
                }

                $semGradePoints += ($gpaVal * $credits);

                $courseList[] = [
                    'code' => $subject ? $subject->code : 'N/A',
                    'name' => $subject ? $subject->name_en : 'N/A',
                    'credits' => $credits,
                    'grade' => $letterGrade,
                    'gpa_point' => $gpaVal,
                ];
            }

            $semGpa = $semCreditsAttempted > 0 ? ($semGradePoints / $semCreditsAttempted) : 0.00;

            // Save semester record in StudentSemesterGpa if not exists
            StudentSemesterGpa::updateOrCreate(
                ['student_id' => $studentId, 'semester_id' => $semId],
                [
                    'gpa' => round($semGpa, 2),
                    'total_credits_attempted' => $semCreditsAttempted,
                    'total_credits_earned' => $semCreditsEarned,
                ]
            );

            $totalCreditsAttempted += $semCreditsAttempted;
            $totalCreditsEarned += $semCreditsEarned;
            $totalGradePoints += $semGradePoints;

            $transcriptList[] = [
                'semester_name' => $semName,
                'semester_code' => $semCode,
                'courses' => $courseList,
                'gpa' => round($semGpa, 2),
                'credits_attempted' => $semCreditsAttempted,
                'credits_earned' => $semCreditsEarned,
            ];
        }

        $cgpa = $totalCreditsAttempted > 0 ? ($totalGradePoints / $totalCreditsAttempted) : 0.00;

        $statuses = [
            1 => 'Active',
            2 => 'Graduated',
            3 => 'Suspended',
            4 => 'Withdrawn',
        ];

        return ApiResponse::success([
            'student_id' => $student->id,
            'student_id_number' => $student->student_id_number,
            'name' => $student->user ? $student->user->name : 'N/A',
            'email' => $student->user ? $student->user->email : 'N/A',
            'program' => $student->program ? $student->program->name_en : 'N/A',
            'status' => $statuses[$student->status_id] ?? 'Active',
            'semesters' => $transcriptList,
            'cgpa' => round($cgpa, 2),
            'total_credits_attempted' => $totalCreditsAttempted,
            'total_credits_earned' => $totalCreditsEarned,
        ], 'Transcript generated dynamically.');
    }

    // =========================================================================
    // PROMOTION & GRADUATION
    // =========================================================================

    public function promoteStudent(Request $request, $studentId): JsonResponse
    {
        $student = Student::find($studentId);
        if (!$student) {
            return ApiResponse::error('Student not found.', 404);
        }

        // Just toggle/advance their semester logs by finding next semester sequence, 
        // or let the admin select the targeted semester
        $request->validate([
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
        ]);

        $student->update([
            'admission_semester_id' => $request->semester_id, // updates current semester
        ]);

        return ApiResponse::success(null, 'Student promoted to the next semester.');
    }

    public function graduateStudent($studentId): JsonResponse
    {
        $student = Student::find($studentId);
        if (!$student) {
            return ApiResponse::error('Student not found.', 404);
        }

        $student->update([
            'status_id' => 2, // Graduated status
        ]);

        return ApiResponse::success(null, 'Student successfully marked as Graduated.');
    }

    // =========================================================================
    // COHORT ANALYTICS
    // =========================================================================

    public function getAnalytics(): JsonResponse
    {
        // 1. Grade distribution (counts of A+, A, B+, B, C+, C, D, F in final exams)
        $gradesCount = DB::table('exam_results')
            ->join('grades', 'exam_results.grade_id', '=', 'grades.id')
            ->select('grades.letter_grade', DB::raw('count(exam_results.id) as total'))
            ->groupBy('grades.letter_grade')
            ->pluck('total', 'letter_grade');

        $gradesDistribution = [
            'A+' => $gradesCount->get('A+', 0),
            'A' => $gradesCount->get('A', 0),
            'B+' => $gradesCount->get('B+', 0),
            'B' => $gradesCount->get('B', 0),
            'C+' => $gradesCount->get('C+', 0),
            'C' => $gradesCount->get('C', 0),
            'D' => $gradesCount->get('D', 0),
            'F' => $gradesCount->get('F', 0),
        ];

        // 2. Average GPA per program
        $programGPAs = StudentSemesterGpa::join('students', 'student_semester_gpas.student_id', '=', 'students.id')
            ->join('programs', 'students.program_id', '=', 'programs.id')
            ->select('programs.code', DB::raw('round(avg(student_semester_gpas.gpa), 2) as avg_gpa'))
            ->groupBy('programs.code')
            ->pluck('avg_gpa', 'code');

        // 3. Overall pass vs fail rates
        $passed = DB::table('exam_results')
            ->join('grades', 'exam_results.grade_id', '=', 'grades.id')
            ->where('grades.letter_grade', '!=', 'F')
            ->count();

        $failed = DB::table('exam_results')
            ->join('grades', 'exam_results.grade_id', '=', 'grades.id')
            ->where('grades.letter_grade', '=', 'F')
            ->count();

        return ApiResponse::success([
            'grades_distribution' => $gradesDistribution,
            'program_gpas' => $programGPAs,
            'rates' => [
                'passed' => $passed,
                'failed' => $failed,
            ]
        ], 'Cohort analytics compiled.');
    }
}
