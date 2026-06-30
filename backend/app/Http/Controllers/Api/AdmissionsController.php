<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Applicant;
use App\Models\Application;
use App\Models\Document;
use App\Models\FinancialTransaction;
use App\Models\StudentInvoice;
use App\Models\SystemNotification;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdmissionsController extends Controller
{
    /**
     * Get active application draft or details for logged-in user.
     */
    public function draft(Request $request): JsonResponse
    {
        $user = $request->user();
        $applicant = Applicant::where('user_id', $user->id)->first();

        if (!$applicant) {
            return ApiResponse::success([
                'has_application' => false,
                'applicant' => null,
                'application' => null,
                'documents' => [],
                'fee_paid' => false,
            ], 'No active application found.');
        }

        $application = Application::where('applicant_id', $applicant->id)->first();
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

        // Check if application fee has been paid
        $feePaid = FinancialTransaction::where('description', 'like', "%Application fee payment for user {$user->email}%")->exists();

        return ApiResponse::success([
            'has_application' => true,
            'applicant' => [
                'application_number' => $applicant->application_number,
                'date_of_birth' => $applicant->date_of_birth ? $applicant->date_of_birth->format('Y-m-d') : null,
                'gender_id' => $applicant->gender_id,
                'contact_number' => $applicant->contact_number,
                'address' => $applicant->address,
            ],
            'application' => $application ? [
                'id' => $application->id,
                'program_id' => $application->program_id,
                'academic_year_id' => $application->academic_year_id,
                'status_id' => $application->status_id,
                'remarks' => $application->remarks,
            ] : null,
            'documents' => $documents,
            'fee_paid' => $feePaid,
        ], 'Application draft retrieved.');
    }

    /**
     * Save application steps as a draft.
     */
    public function saveDraft(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'gender_id' => ['nullable', 'integer', 'exists:genders,id'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
        ]);

        if (isset($validated['name'])) {
            $user->update(['name' => $validated['name']]);
        }

        DB::beginTransaction();
        try {
            // Find or create applicant profile
            $applicant = Applicant::firstOrNew(['user_id' => $user->id]);
            if (!$applicant->exists) {
                // Generate application number
                $year = date('Y');
                $random = rand(1000, 9999);
                $applicant->application_number = "APP-{$year}-{$random}";
            }
            
            if (isset($validated['date_of_birth'])) $applicant->date_of_birth = $validated['date_of_birth'];
            if (isset($validated['gender_id'])) $applicant->gender_id = $validated['gender_id'];
            $applicant->contact_number = $validated['contact_number'] ?? $applicant->contact_number ?? '';
            $applicant->address = $validated['address'] ?? $applicant->address ?? '';
            $applicant->save();

            // Find or create application record
            // Academic Year fallback if not passed
            $academicYearId = $validated['academic_year_id'] ?? AcademicYear::where('is_active', true)->first()?->id ?? 2;
            
            $application = Application::firstOrNew(['applicant_id' => $applicant->id]);
            $application->program_id = $validated['program_id'] ?? $application->program_id ?? 1;
            $application->academic_year_id = $academicYearId;
            // Set as Draft (Status ID: 1) if not submitted yet
            if (!$application->exists || $application->status_id === 1) {
                $application->status_id = 1;
            }
            $application->applied_date = now();
            $application->save();

            DB::commit();
            return $this->draft($request);
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to save draft: ' . $e->getMessage());
        }
    }

    /**
     * Upload an admission document.
     */
    public function uploadDocument(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpeg,png', 'max:5120'], // Max 5MB
            'document_type_id' => ['required', 'integer', 'exists:document_types,id'],
        ]);

        $user = $request->user();
        $file = $request->file('file');

        try {
            // In a production sandbox we save locally under storage
            $path = $file->store("documents/{$user->id}", 'public');
            
            // Delete old document of same type if exists
            Document::where('user_id', $user->id)
                ->where('document_type_id', $request->document_type_id)
                ->delete();

            $doc = Document::create([
                'user_id' => $user->id,
                'document_type_id' => $request->document_type_id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => Storage::url($path),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'uploaded_at' => now(),
            ]);

            return ApiResponse::success([
                'id' => $doc->id,
                'document_type_id' => $doc->document_type_id,
                'file_name' => $doc->file_name,
                'file_path' => $doc->file_path,
                'file_size' => round($doc->file_size / 1024, 2) . ' KB',
                'verified' => false,
            ], 'Document uploaded successfully.');
        } catch (\Exception $e) {
            return ApiResponse::error('File upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Submit finalized application.
     */
    public function submit(Request $request): JsonResponse
    {
        $user = $request->user();
        $applicant = Applicant::where('user_id', $user->id)->first();

        if (!$applicant) {
            return ApiResponse::error('Please fill out the application details first.');
        }

        $application = Application::where('applicant_id', $applicant->id)->first();
        if (!$application || $application->status_id !== 1) {
            return ApiResponse::error('No active draft application to submit.');
        }

        // Validate complete profile requirements before submitting
        if (empty($applicant->date_of_birth) || empty($applicant->gender_id) || empty($applicant->contact_number) || empty($applicant->address)) {
            return ApiResponse::error('Please complete all personal details before submitting.');
        }

        // Check if high school transcript is uploaded (Type ID: 2)
        $hasTranscript = Document::where('user_id', $user->id)
            ->where('document_type_id', 2)
            ->exists();
        if (!$hasTranscript) {
            return ApiResponse::error('Please upload your High School Academic Transcript PDF to submit.');
        }

        // Update status to Submitted (Status ID: 2)
        $application->update([
            'status_id' => 2,
            'applied_date' => now(),
        ]);

        // Create System notification
        $notif = SystemNotification::create([
            'notification_type_id' => 1, // General/System
            'title' => 'Application Submitted Successfully',
            'message' => "Your admission application reference {$applicant->application_number} is locked and sent for review.",
            'sender_user_id' => 1, // System Admin
        ]);

        UserNotification::create([
            'notification_id' => $notif->id,
            'user_id' => $user->id,
        ]);

        return ApiResponse::success(null, 'Your application has been submitted successfully.');
    }

    /**
     * Simulate application fee payment.
     */
    public function payFee(Request $request): JsonResponse
    {
        $request->validate([
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
        ]);

        $user = $request->user();
        
        DB::beginTransaction();
        try {
            // Check if already paid
            $alreadyPaid = FinancialTransaction::where('description', 'like', "%Application fee payment for user {$user->email}%")->exists();

            if ($alreadyPaid) {
                return ApiResponse::error('Application fee has already been paid.');
            }

            // Create Transaction record directly without invoice association
            FinancialTransaction::create([
                'transaction_type_id' => 1, // Credit
                'amount' => 100.00,
                'transaction_date' => now(),
                'payment_method_id' => $request->payment_method_id,
                'reference_number' => 'TXN-' . Str::random(8),
                'invoice_id' => null, // null since applicants don't have invoices in students table
                'description' => 'Application fee payment for user ' . $user->email,
            ]);

            DB::commit();
            return ApiResponse::success(null, 'Application fee paid successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to log payment: ' . $e->getMessage());
        }
    }

    /**
     * Get application timeline checklists.
     */
    public function timeline(Request $request): JsonResponse
    {
        $user = $request->user();
        $applicant = Applicant::where('user_id', $user->id)->first();
        
        $currentStatusId = 0;
        if ($applicant) {
            $application = Application::where('applicant_id', $applicant->id)->first();
            if ($application) {
                $currentStatusId = $application->status_id;
            }
        }

        // Timeline statuses mapping (based on applicant_statuses lookup)
        // 1=Draft, 2=Submitted, 3=Under Review, 4=Interview, 5=Selected, 6=Rejected, 7=Enrolled
        $stages = [
            ['id' => 1, 'label' => 'Draft Created', 'desc' => 'Fill details and save sections.'],
            ['id' => 2, 'label' => 'Submitted', 'desc' => 'Finalized and locked for review.'],
            ['id' => 3, 'label' => 'Under Review', 'desc' => 'Registrar team is validating credentials.'],
            ['id' => 4, 'label' => 'Placement Interview', 'desc' => 'Entrance exam and narrator critique session.'],
            ['id' => 5, 'label' => 'Admission Offer', 'desc' => 'Approved. Review and accept offer letter.'],
            ['id' => 7, 'label' => 'Enrolled', 'desc' => 'Matriculated. Student ID assigned.'],
        ];

        // Rejected override if status is Rejected (6)
        if ($currentStatusId === 6) {
            $stages = [
                ['id' => 1, 'label' => 'Draft Created', 'desc' => 'Fill details and save sections.'],
                ['id' => 2, 'label' => 'Submitted', 'desc' => 'Finalized and locked for review.'],
                ['id' => 6, 'label' => 'Rejected', 'desc' => 'Application declined by admissions committee.'],
            ];
        }

        $timeline = [];
        $reachedCurrent = false;

        foreach ($stages as $stage) {
            $status = 'pending';
            
            if ($currentStatusId === 6) { // Rejected flow
                if ($stage['id'] < 6) $status = 'completed';
                if ($stage['id'] === 6) $status = 'active'; // Rejected is active
            } else { // Standard flow
                if ($currentStatusId >= $stage['id']) {
                    $status = ($currentStatusId === $stage['id']) ? 'active' : 'completed';
                }
            }

            $timeline[] = [
                'label' => $stage['label'],
                'desc' => $stage['desc'],
                'status' => $status,
            ];
        }

        return ApiResponse::success($timeline, 'Application status timeline retrieved.');
    }
}
