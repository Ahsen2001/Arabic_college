<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentHifzProgress;
use App\Models\HifzDailyLog;
use App\Models\HifzAssessment;
use App\Models\HifzMilestone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HifzMemorizationController extends Controller
{
    // =========================================================================
    // DAILY HIFZ LOGS
    // =========================================================================

    public function logDaily(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'log_date' => ['required', 'date'],
            'sabaq_surah' => ['nullable', 'string', 'max:255'],
            'sabaq_ayah_start' => ['nullable', 'integer', 'min:1'],
            'sabaq_ayah_end' => ['nullable', 'integer', 'min:1'],
            'sabaq_status' => ['nullable', 'string', 'max:50'],
            'sabki_juz' => ['nullable', 'integer', 'min:1', 'max:30'],
            'sabki_page_start' => ['nullable', 'integer', 'min:1'],
            'sabki_page_end' => ['nullable', 'integer', 'min:1'],
            'sabki_status' => ['nullable', 'string', 'max:50'],
            'manzil_juz' => ['nullable', 'integer', 'min:1', 'max:30'],
            'manzil_status' => ['nullable', 'string', 'max:50'],
            'mistakes_count' => ['required', 'integer', 'min:0'],
            'tajweed_score' => ['required', 'integer', 'min:0', 'max:100'],
            'teacher_remarks' => ['nullable', 'string'],
            
            // Progress parameters
            'current_juz' => ['required', 'integer', 'min:1', 'max:30'],
            'current_surah' => ['required', 'integer', 'min:1', 'max:114'],
            'current_ayah' => ['required', 'integer', 'min:1'],
            'completion_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::beginTransaction();
        try {
            // 1. Save daily lesson roll
            $log = HifzDailyLog::updateOrCreate(
                [
                    'student_id' => $request->student_id,
                    'log_date' => $request->log_date,
                ],
                [
                    'sabaq_surah' => $request->sabaq_surah,
                    'sabaq_ayah_start' => $request->sabaq_ayah_start,
                    'sabaq_ayah_end' => $request->sabaq_ayah_end,
                    'sabaq_status' => $request->sabaq_status,
                    'sabki_juz' => $request->sabki_juz,
                    'sabki_page_start' => $request->sabki_page_start,
                    'sabki_page_end' => $request->sabki_page_end,
                    'sabki_status' => $request->sabki_status,
                    'manzil_juz' => $request->manzil_juz,
                    'manzil_status' => $request->manzil_status,
                    'mistakes_count' => $request->mistakes_count,
                    'tajweed_score' => $request->tajweed_score,
                    'teacher_remarks' => $request->teacher_remarks,
                    'marked_by_user_id' => $request->user()->id,
                ]
            );

            // 2. Sync progress parameters
            StudentHifzProgress::updateOrCreate(
                ['student_id' => $request->student_id],
                [
                    'current_juz' => $request->current_juz,
                    'current_surah' => $request->current_surah,
                    'current_ayah' => $request->current_ayah,
                    'completion_percentage' => $request->completion_percentage,
                ]
            );

            DB::commit();
            return ApiResponse::success($log, 'Daily Hifz progress logged.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Transaction failed: ' . $e->getMessage());
        }
    }

    // =========================================================================
    // HIFZ WEEKLY / MONTHLY ASSESSMENTS
    // =========================================================================

    public function logAssessment(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'assessment_type' => ['required', 'string', 'in:weekly,monthly'],
            'assessment_date' => ['required', 'date'],
            'juz_tested' => ['required', 'string', 'max:255'],
            'memorization_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'tajweed_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'remarks' => ['nullable', 'string'],
        ]);

        // Auto-assign Grade
        $avg = ($request->memorization_score + $request->tajweed_score) / 2;
        $grade = 'F';
        if ($avg >= 95) $grade = 'A+';
        elseif ($avg >= 90) $grade = 'A';
        elseif ($avg >= 85) $grade = 'B+';
        elseif ($avg >= 80) $grade = 'B';
        elseif ($avg >= 70) $grade = 'C';
        elseif ($avg >= 60) $grade = 'D';

        $assessment = HifzAssessment::create([
            'student_id' => $request->student_id,
            'assessment_type' => $request->assessment_type,
            'assessment_date' => $request->assessment_date,
            'juz_tested' => $request->juz_tested,
            'memorization_score' => $request->memorization_score,
            'tajweed_score' => $request->tajweed_score,
            'grade' => $grade,
            'remarks' => $request->remarks,
            'assessed_by_user_id' => $request->user()->id,
        ]);

        return ApiResponse::success($assessment, 'Hifz assessment registered.');
    }

    // =========================================================================
    // HIFZ MILESTONES
    // =========================================================================

    public function logMilestone(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'milestone_name' => ['required', 'string', 'max:255'], // e.g. "5 Juz", "Full Quran (Khatm)"
            'completion_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);

        $milestone = HifzMilestone::create([
            'student_id' => $request->student_id,
            'milestone_name' => $request->milestone_name,
            'completion_date' => $request->completion_date,
            'verified_by_user_id' => $request->user()->id,
            'remarks' => $request->remarks,
        ]);

        return ApiResponse::success($milestone, 'Achievement milestone unlocked!');
    }

    // =========================================================================
    // STUDENT HIFZ DASHBOARD QUERY
    // =========================================================================

    public function getProgress($studentId): JsonResponse
    {
        $student = Student::with(['user', 'program'])->find($studentId);
        if (!$student) {
            return ApiResponse::error('Student profile not found.', 404);
        }

        $progress = StudentHifzProgress::where('student_id', $studentId)->first();
        $logs = HifzDailyLog::where('student_id', $studentId)->orderBy('log_date', 'desc')->take(20)->get();
        $assessments = HifzAssessment::where('student_id', $studentId)->orderBy('assessment_date', 'desc')->get();
        $milestones = HifzMilestone::where('student_id', $studentId)->orderBy('completion_date', 'desc')->get();

        // Calculate statistics
        $allLogs = HifzDailyLog::where('student_id', $studentId)->get();
        $avgMistakes = $allLogs->count() > 0 ? round($allLogs->avg('mistakes_count'), 1) : 0;
        $avgTajweed = $allLogs->count() > 0 ? round($allLogs->avg('tajweed_score'), 1) : 100;

        return ApiResponse::success([
            'student_id' => $student->id,
            'student_id_number' => $student->student_id_number,
            'name' => $student->user ? $student->user->name : 'N/A',
            'email' => $student->user ? $student->user->email : 'N/A',
            'program' => $student->program ? $student->program->name_en : 'N/A',
            
            // Progress parameters
            'progress' => $progress ?: [
                'current_juz' => 1,
                'current_surah' => 1,
                'current_ayah' => 1,
                'completion_percentage' => 0.00
            ],
            
            // Sub logs
            'logs' => $logs,
            'assessments' => $assessments,
            'milestones' => $milestones,
            
            // Stats
            'stats' => [
                'total_sessions' => $allLogs->count(),
                'avg_mistakes' => $avgMistakes,
                'avg_tajweed' => $avgTajweed,
            ]
        ], 'Student Hifz parameters retrieved.');
    }

    // =========================================================================
    // COHORT ANALYTICS & REPORTS
    // =========================================================================

    public function getReports(): JsonResponse
    {
        // 1. Milestones distribution count
        $milestonesCount = DB::table('hifz_milestones')
            ->select('milestone_name', DB::raw('count(id) as total'))
            ->groupBy('milestone_name')
            ->pluck('total', 'milestone_name');

        // 2. Average daily mistake count trend (Group by Surah or month)
        $avgMistakesByMonth = DB::table('hifz_daily_logs')
            ->select(DB::raw("DATE_FORMAT(log_date, '%Y-%m') as month"), DB::raw('round(avg(mistakes_count), 1) as avg_mistakes'))
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('avg_mistakes', 'month');

        // 3. Average Tajweed score trend
        $avgTajweedByMonth = DB::table('hifz_daily_logs')
            ->select(DB::raw("DATE_FORMAT(log_date, '%Y-%m') as month"), DB::raw('round(avg(tajweed_score), 1) as avg_tajweed'))
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('avg_tajweed', 'month');

        return ApiResponse::success([
            'milestones_distribution' => $milestonesCount,
            'avg_mistakes_trend' => $avgMistakesByMonth,
            'avg_tajweed_trend' => $avgTajweedByMonth,
        ], 'Hifz cohort analytics compiled.');
    }
}
