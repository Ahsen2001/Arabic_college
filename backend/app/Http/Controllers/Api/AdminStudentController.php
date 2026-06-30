<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentGuardian;
use App\Models\StudentEmergencyContact;
use App\Models\StudentEducationHistory;
use App\Models\StudentMedicalRecord;
use App\Models\StudentScholarship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminStudentController extends Controller
{
    /**
     * Display a listing of students with advanced filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Student::with(['user', 'program', 'admissionSemester', 'scholarships']);

        // Search filter
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_id_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Program filter
        if ($request->has('program_id') && !empty($request->program_id)) {
            $query->where('program_id', $request->program_id);
        }

        // Status filter
        if ($request->has('status_id') && !empty($request->status_id)) {
            $query->where('status_id', $request->status_id);
        }

        // Scholarship status filter (Filter students having active scholarships)
        if ($request->has('has_scholarship') && !empty($request->has_scholarship)) {
            if ($request->has_scholarship == 'yes') {
                $query->whereHas('scholarships', function ($sq) {
                    $sq->where('status', 'Active');
                });
            } elseif ($request->has_scholarship == 'no') {
                $query->whereDoesntHave('scholarships', function ($sq) {
                    $sq->where('status', 'Active');
                });
            }
        }

        // Pagination
        $perPage = $request->input('per_page', 10);
        $paginated = $query->orderBy('student_id_number', 'asc')->paginate($perPage);

        $statuses = [
            1 => 'Active',
            2 => 'Graduated',
            3 => 'Suspended',
            4 => 'Withdrawn',
        ];

        $items = collect($paginated->items())->map(function ($student) use ($statuses) {
            $hasActiveScholarship = $student->scholarships->where('status', 'Active')->isNotEmpty();
            return [
                'id' => $student->id,
                'student_id_number' => $student->student_id_number,
                'name' => $student->user ? $student->user->name : 'N/A',
                'email' => $student->user ? $student->user->email : 'N/A',
                'program' => $student->program ? $student->program->name_en : 'N/A',
                'status_id' => $student->status_id,
                'status_name' => $statuses[$student->status_id] ?? 'Unknown',
                'admission_date' => $student->admission_date ? $student->admission_date->format('Y-m-d') : null,
                'has_scholarship' => $hasActiveScholarship,
            ];
        });

        return ApiResponse::success([
            'students' => $items,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ], 'Students list retrieved.');
    }

    /**
     * Retrieve a detailed student profile with all relations.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $student = Student::with([
            'user.documents',
            'program',
            'admissionSemester',
            'guardian',
            'emergencyContacts',
            'educationHistories',
            'medicalRecord',
            'scholarships',
        ])->find($id);

        if (!$student) {
            return ApiResponse::error('Student profile not found.', 404);
        }

        $statuses = [
            1 => 'Active',
            2 => 'Graduated',
            3 => 'Suspended',
            4 => 'Withdrawn',
        ];

        // Format document structures
        $documents = $student->user?->documents->map(function ($doc) {
            return [
                'id' => $doc->id,
                'document_type_id' => $doc->document_type_id,
                'file_name' => $doc->file_name,
                'file_path' => $doc->file_path,
                'file_size' => round($doc->file_size / 1024, 2) . ' KB',
                'verified' => !is_null($doc->verified_at),
            ];
        }) ?: [];

        return ApiResponse::success([
            'id' => $student->id,
            'student_id_number' => $student->student_id_number,
            'name' => $student->user ? $student->user->name : 'N/A',
            'email' => $student->user ? $student->user->email : 'N/A',
            'phone' => $student->user ? $student->user->phone : 'N/A',
            'program_id' => $student->program_id,
            'program_name' => $student->program ? $student->program->name_en : 'N/A',
            'admission_semester_id' => $student->admission_semester_id,
            'admission_semester' => $student->admissionSemester ? $student->admissionSemester->name : 'N/A',
            'status_id' => $student->status_id,
            'status_name' => $statuses[$student->status_id] ?? 'Unknown',
            'admission_date' => $student->admission_date ? $student->admission_date->format('Y-m-d') : null,
            'guardian' => $student->guardian,
            'emergency_contacts' => $student->emergencyContacts,
            'education_histories' => $student->educationHistories,
            'medical_record' => $student->medicalRecord,
            'scholarships' => $student->scholarships,
            'documents' => $documents,
        ], 'Student profile dossier retrieved.');
    }

    /**
     * Update main student profile records.
     */
    public function updateProfile(Request $request, $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return ApiResponse::error('Student record not found.', 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'program_id' => ['required', 'integer', 'exists:programs,id'],
            'status_id' => ['required', 'integer', 'in:1,2,3,4'],
        ]);

        DB::beginTransaction();
        try {
            // Update User parameters
            if ($student->user) {
                $student->user->update([
                    'name' => $request->name,
                    'phone' => $request->phone,
                ]);
            }

            // Update Student parameters
            $student->update([
                'program_id' => $request->program_id,
                'status_id' => $request->status_id,
            ]);

            DB::commit();
            return ApiResponse::success(null, 'Student basic profile updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Failed to update student profile: ' . $e->getMessage());
        }
    }

    /**
     * Update or create guardian details.
     */
    public function updateGuardian(Request $request, $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return ApiResponse::error('Student record not found.', 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'relationship' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'address' => ['required', 'string'],
            'occupation' => ['nullable', 'string'],
        ]);

        $guardian = StudentGuardian::updateOrCreate(
            ['student_id' => $student->id],
            $request->only(['name', 'relationship', 'phone', 'email', 'address', 'occupation'])
        );

        return ApiResponse::success($guardian, 'Guardian records updated successfully.');
    }

    /**
     * Update emergency contacts.
     */
    public function updateEmergency(Request $request, $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return ApiResponse::error('Student record not found.', 404);
        }

        $request->validate([
            'contacts' => ['required', 'array'],
            'contacts.*.name' => ['required', 'string', 'max:255'],
            'contacts.*.relationship' => ['required', 'string', 'max:255'],
            'contacts.*.phone' => ['required', 'string'],
            'contacts.*.alternate_phone' => ['nullable', 'string'],
        ]);

        DB::beginTransaction();
        try {
            // Delete old emergency contacts
            StudentEmergencyContact::where('student_id', $student->id)->delete();

            // Insert new emergency contacts
            foreach ($request->contacts as $contact) {
                StudentEmergencyContact::create([
                    'student_id' => $student->id,
                    'name' => $contact['name'],
                    'relationship' => $contact['relationship'],
                    'phone' => $contact['phone'],
                    'alternate_phone' => $contact['alternate_phone'] ?? null,
                ]);
            }

            DB::commit();
            return ApiResponse::success(null, 'Emergency contacts updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Emergency contacts update failed: ' . $e->getMessage());
        }
    }

    /**
     * Update education history.
     */
    public function updateEducation(Request $request, $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return ApiResponse::error('Student record not found.', 404);
        }

        $request->validate([
            'education' => ['required', 'array'],
            'education.*.institution_name' => ['required', 'string', 'max:255'],
            'education.*.degree_diploma' => ['required', 'string', 'max:255'],
            'education.*.passing_year' => ['required', 'integer'],
            'education.*.gpa_percentage' => ['required', 'string'],
        ]);

        DB::beginTransaction();
        try {
            // Delete old education histories
            StudentEducationHistory::where('student_id', $student->id)->delete();

            // Insert new education histories
            foreach ($request->education as $edu) {
                StudentEducationHistory::create([
                    'student_id' => $student->id,
                    'institution_name' => $edu['institution_name'],
                    'degree_diploma' => $edu['degree_diploma'],
                    'passing_year' => $edu['passing_year'],
                    'gpa_percentage' => $edu['gpa_percentage'],
                ]);
            }

            DB::commit();
            return ApiResponse::success(null, 'Education history updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Education history update failed: ' . $e->getMessage());
        }
    }

    /**
     * Update medical information records.
     */
    public function updateMedical(Request $request, $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return ApiResponse::error('Student record not found.', 404);
        }

        $request->validate([
            'blood_type' => ['required', 'string', 'max:10'],
            'allergies' => ['nullable', 'string'],
            'chronic_conditions' => ['nullable', 'string'],
            'emergency_notes' => ['nullable', 'string'],
        ]);

        $medical = StudentMedicalRecord::updateOrCreate(
            ['student_id' => $student->id],
            $request->only(['blood_type', 'allergies', 'chronic_conditions', 'emergency_notes'])
        );

        return ApiResponse::success($medical, 'Medical record updated.');
    }

    /**
     * Update scholarships details.
     */
    public function updateScholarship(Request $request, $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return ApiResponse::error('Student record not found.', 404);
        }

        $request->validate([
            'scholarships' => ['required', 'array'],
            'scholarships.*.scholarship_name' => ['required', 'string', 'max:255'],
            'scholarships.*.discount_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'scholarships.*.award_date' => ['required', 'date'],
            'scholarships.*.status' => ['required', 'string', 'in:Active,Suspended,Inactive'],
        ]);

        DB::beginTransaction();
        try {
            // Delete old scholarships
            StudentScholarship::where('student_id', $student->id)->delete();

            // Insert new scholarships
            foreach ($request->scholarships as $sch) {
                StudentScholarship::create([
                    'student_id' => $student->id,
                    'scholarship_name' => $sch['scholarship_name'],
                    'discount_percentage' => $sch['discount_percentage'],
                    'award_date' => $sch['award_date'],
                    'status' => $sch['status'],
                ]);
            }

            DB::commit();
            return ApiResponse::success(null, 'Scholarships data updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Scholarships update failed: ' . $e->getMessage());
        }
    }

    /**
     * CSV Bulk Export.
     */
    public function export(Request $request)
    {
        $students = Student::with(['user', 'program'])->get();

        // Log export file download
        \App\Models\AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'file_download',
            'model_type' => Student::class,
            'model_id' => null,
            'new_values' => ['filename' => 'students_export_' . date('Ymd_His') . '.csv', 'type' => 'student_export'],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=students_export_" . date('Ymd_His') . ".csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($students) {
            $file = fopen('php://output', 'w');
            // CSV Header
            fputcsv($file, ['Student ID', 'Name', 'Email', 'Phone', 'Program/Track', 'Admission Date', 'Status ID']);

            foreach ($students as $stu) {
                fputcsv($file, [
                    $stu->student_id_number,
                    $stu->user ? $stu->user->name : '',
                    $stu->user ? $stu->user->email : '',
                    $stu->user ? $stu->user->phone : '',
                    $stu->program ? $stu->program->name_en : '',
                    $stu->admission_date ? $stu->admission_date->format('Y-m-d') : '',
                    $stu->status_id
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * CSV Bulk Import.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        
        $csvData = array_map('str_getcsv', file($path));
        
        if (count($csvData) < 2) {
            return ApiResponse::error('The uploaded CSV file is empty or missing data rows.');
        }

        $header = array_shift($csvData); // Remove header row

        $imported = 0;
        $skipped = 0;

        DB::beginTransaction();
        try {
            foreach ($csvData as $row) {
                if (count($row) < 5) {
                    $skipped++;
                    continue;
                }

                // Columns: 0=Name, 1=Email, 2=Phone, 3=Program ID, 4=Semester ID
                $name = trim($row[0]);
                $email = trim($row[1]);
                $phone = trim($row[2]);
                $programId = intval($row[3]);
                $semesterId = intval($row[4]);

                // Check if user already exists
                $existingUser = User::where('email', $email)->first();
                if ($existingUser) {
                    $skipped++;
                    continue;
                }

                // Create User
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'phone' => $phone,
                    'password' => Hash::make('Student@College2026'),
                    'status_id' => 1, // Active
                ]);

                // Assign Student Role
                $user->assignRole('Student');

                // Generate random student ID
                $year = date('Y');
                $random = rand(1000, 9999);
                $studentIdNumber = "STU{$year}{$random}";

                // Create Student Profile
                Student::create([
                    'user_id' => $user->id,
                    'student_id_number' => $studentIdNumber,
                    'program_id' => $programId,
                    'admission_semester_id' => $semesterId,
                    'status_id' => 1, // Active
                    'admission_date' => now(),
                ]);

                $imported++;
            }

            DB::commit();
            return ApiResponse::success([
                'imported' => $imported,
                'skipped' => $skipped,
            ], "CSV import completed. Imported: {$imported}, Skipped duplicate/invalid records: {$skipped}.");
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('CSV import failed: ' . $e->getMessage());
        }
    }
}
