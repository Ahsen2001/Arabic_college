<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Mail\BulkAdmissionsMail;
use App\Mail\SendInterviewScheduleMail;
use App\Mail\SendOfferLetterMail;
use App\Models\Applicant;
use App\Models\Application;
use App\Models\Document;
use App\Models\Student;
use App\Models\SystemNotification;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminAdmissionsController extends Controller
{
    /**
     * List all applications with status and program filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Application::with(['applicant.user', 'program', 'academicYear']);

        if ($request->has('status_id') && !empty($request->status_id)) {
            $query->where('status_id', $request->status_id);
        }

        if ($request->has('program_id') && !empty($request->program_id)) {
            $query->where('program_id', $request->program_id);
        }

        $applications = $query->orderBy('updated_at', 'desc')->get()->map(function ($app) {
            // Determine status text
            $statuses = [
                1 => 'Draft',
                2 => 'Submitted',
                3 => 'Under Review',
                4 => 'Interview',
                5 => 'Selected',
                6 => 'Rejected',
                7 => 'Enrolled',
            ];
            $statusName = $statuses[$app->status_id] ?? 'Unknown';

            return [
                'id' => $app->id,
                'application_number' => $app->applicant ? $app->applicant->application_number : 'N/A',
                'name' => $app->applicant && $app->applicant->user ? $app->applicant->user->name : 'Anonymous',
                'email' => $app->applicant && $app->applicant->user ? $app->applicant->user->email : 'N/A',
                'program' => $app->program ? $app->program->name_en : 'N/A',
                'academic_year' => $app->academicYear ? $app->academicYear->name : 'N/A',
                'status_id' => $app->status_id,
                'status_name' => $statusName,
                'applied_date' => $app->applied_date ? $app->applied_date->format('Y-m-d') : null,
            ];
        });

        return ApiResponse::success($applications, 'Applications list retrieved.');
    }

    /**
     * View detailed application details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $application = Application::with(['applicant.user', 'program', 'academicYear'])->find($id);

        if (!$application) {
            return ApiResponse::error('Application not found.', 404);
        }

        $user = $application->applicant?->user;
        $documents = [];

        if ($user) {
            $documents = Document::where('user_id', $user->id)->get()->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'document_type_id' => $doc->document_type_id,
                    'file_name' => $doc->file_name,
                    'file_path' => $doc->file_path,
                    'file_size' => round($doc->file_size / 1024, 2) . ' KB',
                    'verified' => !is_null($doc->verified_at),
                ];
            });
        }

        $statuses = [
            1 => 'Draft',
            2 => 'Submitted',
            3 => 'Under Review',
            4 => 'Interview',
            5 => 'Selected',
            6 => 'Rejected',
            7 => 'Enrolled',
        ];
        
        $applicantDetails = $application->applicant;

        return ApiResponse::success([
            'id' => $application->id,
            'application_number' => $applicantDetails ? $applicantDetails->application_number : 'N/A',
            'name' => $user ? $user->name : 'Anonymous',
            'email' => $user ? $user->email : 'N/A',
            'date_of_birth' => $applicantDetails && $applicantDetails->date_of_birth ? $applicantDetails->date_of_birth->format('Y-m-d') : null,
            'contact_number' => $applicantDetails ? $applicantDetails->contact_number : 'N/A',
            'address' => $applicantDetails ? $applicantDetails->address : 'N/A',
            'program_id' => $application->program_id,
            'program' => $application->program ? $application->program->name_en : 'N/A',
            'academic_year' => $application->academicYear ? $application->academicYear->name : 'N/A',
            'status_id' => $application->status_id,
            'status_name' => $statuses[$application->status_id] ?? 'Unknown',
            'applied_date' => $application->applied_date ? $application->applied_date->format('Y-m-d') : null,
            'remarks' => $application->remarks,
            'documents' => $documents,
        ], 'Application details retrieved.');
    }

    /**
     * Update application status (Under Review / Reject).
     */
    public function review(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status_id' => ['required', 'integer', 'in:3,6'], // 3 = Under Review, 6 = Rejected
            'remarks' => ['nullable', 'string'],
        ]);

        $application = Application::find($id);

        if (!$application) {
            return ApiResponse::error('Application not found.', 404);
        }

        $application->update([
            'status_id' => $request->status_id,
            'remarks' => $request->remarks ?? $application->remarks,
        ]);

        // Send notifications
        $user = $application->applicant?->user;
        if ($user) {
            $statusLabel = ($request->status_id == 3) ? 'Under Review' : 'Rejected';
            
            $notif = SystemNotification::create([
                'notification_type_id' => 1,
                'title' => 'Admission Application Update',
                'message' => "Your application status has been updated to: {$statusLabel}.",
                'sender_user_id' => $request->user()->id,
            ]);

            UserNotification::create([
                'notification_id' => $notif->id,
                'user_id' => $user->id,
            ]);
        }

        return ApiResponse::success(null, 'Application review status updated.');
    }

    /**
     * Schedule a placement interview and examination.
     */
    public function scheduleInterview(Request $request, $id): JsonResponse
    {
        $request->validate([
            'interview_date' => ['required', 'date'],
            'interview_time' => ['required', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);

        $application = Application::with('applicant.user', 'program')->find($id);

        if (!$application) {
            return ApiResponse::error('Application not found.', 404);
        }

        $remarks = "Interview Scheduled: {$request->interview_date} at {$request->interview_time}. " . ($request->remarks ?? '');

        $application->update([
            'status_id' => 4, // Interview
            'remarks' => $remarks,
        ]);

        $user = $application->applicant?->user;
        if ($user) {
            // Send interview email notification
            Mail::to($user->email)->send(new SendInterviewScheduleMail(
                $user->name,
                $request->interview_date,
                $request->interview_time,
                $application->program ? $application->program->name_en : 'General Studies'
            ));

            $notif = SystemNotification::create([
                'notification_type_id' => 1,
                'title' => 'Interview Scheduled',
                'message' => "Your admissions interview is scheduled for {$request->interview_date} at {$request->interview_time}.",
                'sender_user_id' => $request->user()->id,
            ]);

            UserNotification::create([
                'notification_id' => $notif->id,
                'user_id' => $user->id,
            ]);
        }

        return ApiResponse::success(null, 'Interview successfully scheduled and email notification dispatched.');
    }

    /**
     * Promotes status to Selected (Approved for enrollment).
     */
    public function select(Request $request, $id): JsonResponse
    {
        $application = Application::with('applicant.user', 'program')->find($id);

        if (!$application) {
            return ApiResponse::error('Application not found.', 404);
        }

        $application->update([
            'status_id' => 5, // Selected
        ]);

        $user = $application->applicant?->user;
        if ($user) {
            // Send offer letter mailable
            Mail::to($user->email)->send(new SendOfferLetterMail(
                $user->name,
                $application->program ? $application->program->name_en : 'Islamic Studies Track',
                $application->applicant->application_number
            ));

            $notif = SystemNotification::create([
                'notification_type_id' => 1,
                'title' => 'Congratulations! Admission Offer Extended',
                'message' => "You have been selected for admission. Please review your offer letter in the portal.",
                'sender_user_id' => $request->user()->id,
            ]);

            UserNotification::create([
                'notification_id' => $notif->id,
                'user_id' => $user->id,
            ]);
        }

        return ApiResponse::success(null, 'Applicant promoted to Selected status.');
    }

    /**
     * Enroll selected applicant as active student.
     */
    public function enroll(Request $request, $id): JsonResponse
    {
        $application = Application::with('applicant.user', 'program')->find($id);

        if (!$application) {
            return ApiResponse::error('Application not found.', 404);
        }

        if ($application->status_id !== 5) {
            return ApiResponse::error('Only Selected applicants can be matriculated.');
        }

        $applicant = $application->applicant;
        $user = $applicant->user;

        DB::beginTransaction();
        try {
            // Create student ID code e.g. STU + year + random 4 digits
            $year = date('Y');
            $random = rand(1000, 9999);
            $studentIdNumber = "STU{$year}{$random}";

            // Check if student profile already exists for safety
            $student = Student::where('user_id', $user->id)->first();
            if (!$student) {
                $student = Student::create([
                    'user_id' => $user->id,
                    'student_id_number' => $studentIdNumber,
                    'program_id' => $application->program_id,
                    'admission_semester_id' => 3, // Fall Semester 2026 (Active)
                    'status_id' => 1, // Active student lookup
                    'admission_date' => now(),
                ]);
            }

            // Update application status to Enrolled (7)
            $application->update(['status_id' => 7]);

            // Role Synchronization via Spatie Permissions
            $user->removeRole('Applicant');
            $user->assignRole('Student');

            // Send notification
            $notif = SystemNotification::create([
                'notification_type_id' => 2, // Academic
                'title' => 'Enrolled Successfully',
                'message' => "Welcome to Arabic College! You have been enrolled under Student ID {$student->student_id_number}.",
                'sender_user_id' => $request->user()->id,
            ]);

            UserNotification::create([
                'notification_id' => $notif->id,
                'user_id' => $user->id,
            ]);

            DB::commit();
            return ApiResponse::success([
                'student_id' => $student->student_id_number,
                'enrolled_at' => $student->admission_date->format('Y-m-d'),
            ], 'Applicant successfully enrolled as active student.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Enrollment failed: ' . $e->getMessage());
        }
    }

    /**
     * Dispatch bulk emails to candidates in a specific status.
     */
    public function bulkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'status_id' => ['required', 'integer', 'in:2,3,4,5,6'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'min:10'],
        ]);

        $applications = Application::with('applicant.user')
            ->where('status_id', $request->status_id)
            ->get();

        if ($applications->isEmpty()) {
            return ApiResponse::error('No applicants found matching this status.');
        }

        $emailsSent = 0;

        foreach ($applications as $app) {
            $user = $app->applicant?->user;
            if ($user && $user->email) {
                Mail::to($user->email)->send(new BulkAdmissionsMail($request->subject, $request->body));
                $emailsSent++;
            }
        }

        return ApiResponse::success([
            'count' => $emailsSent,
        ], "Successfully sent bulk email queries to {$emailsSent} applicants.");
    }
}
