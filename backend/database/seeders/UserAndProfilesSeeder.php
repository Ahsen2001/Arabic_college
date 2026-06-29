<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Applicant;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use App\Models\Course;
use App\Models\Book;
use App\Models\Application;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentAttendance;
use App\Models\StaffAttendance;
use App\Models\Examination;
use App\Models\ExamResult;
use App\Models\StudentSemesterGpa;
use App\Models\ResearchProject;
use App\Models\ResearchMember;
use App\Models\ResearchPublication;
use App\Models\LibraryBorrow;
use App\Models\StudentInvoice;
use App\Models\StudentInvoiceItem;
use App\Models\FinancialTransaction;
use App\Models\Document;
use App\Models\SystemNotification;
use App\Models\UserNotification;
use App\Models\Setting;
use App\Models\Backup;
use App\Models\AuditLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UserAndProfilesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Super Admin User
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@arabiccollege.edu'],
            [
                'name' => 'Dr. Ahmad Al-Khalili',
                'password' => Hash::make('password'),
                'phone' => '+966501234567',
                'status_id' => 1, // Active
                'email_verified_at' => now(),
            ]
        );
        $adminUser->assignRole('Super Admin');

        // Create General Staff for Administrative roles
        // Registrar Staff
        $registrarUser1 = User::factory()->create([
            'name' => 'Omar Farooq (Registrar)',
            'email' => 'registrar1@arabiccollege.edu',
            'password' => Hash::make('password'),
        ]);
        $registrarUser1->assignRole('Registrar');
        $registrarStaff1 = Staff::factory()->create([
            'user_id' => $registrarUser1->id,
            'staff_role_id' => 6, // Registrar role lookup
        ]);

        // Accountant Staff
        $accountantUser = User::factory()->create([
            'name' => 'Suleiman Al-Habib (Accountant)',
            'email' => 'finance@arabiccollege.edu',
            'password' => Hash::make('password'),
        ]);
        $accountantUser->assignRole('Accountant');
        $accountantStaff = Staff::factory()->create([
            'user_id' => $accountantUser->id,
            'staff_role_id' => 2, // Accountant role lookup
        ]);

        // Librarian Staff
        $librarianUser = User::factory()->create([
            'name' => 'Khalid Bin Waleed (Librarian)',
            'email' => 'library@arabiccollege.edu',
            'password' => Hash::make('password'),
        ]);
        $librarianUser->assignRole('Librarian');
        $librarianStaff = Staff::factory()->create([
            'user_id' => $librarianUser->id,
            'staff_role_id' => 3, // Librarian role lookup
        ]);

        // 2. Teachers (5 total)
        $teachers = [];
        $teacherSubjects = [
            1 => 'Islamic Jurisprudence (Fiqh)',
            2 => 'Arabic Grammar',
            3 => 'Hadith Sciences',
            4 => 'Quranic Exegesis',
            5 => 'Islamic History'
        ];

        for ($i = 1; $i <= 5; $i++) {
            $user = User::factory()->create([
                'name' => 'Sheikh Dr. ' . fake()->firstNameMale() . ' ' . fake()->lastName(),
                'email' => 'teacher' . $i . '@arabiccollege.edu',
                'password' => Hash::make('password'),
            ]);
            $user->assignRole('Teacher');

            // Distribute across departments (1=Sharia, 2=Arabic, 3=Hadith)
            $deptId = ($i <= 2) ? 1 : (($i <= 4) ? 2 : 3);

            $teachers[] = Teacher::factory()->create([
                'user_id' => $user->id,
                'department_id' => $deptId,
                'specialization' => $teacherSubjects[$i],
            ]);
        }

        // Set Head Teachers for the Departments (Teacher 1 -> Sharia, Teacher 3 -> Arabic, Teacher 5 -> Hadith)
        DB::table('departments')->where('id', 1)->update(['head_teacher_id' => $teachers[0]->id]);
        DB::table('departments')->where('id', 2)->update(['head_teacher_id' => $teachers[2]->id]);
        DB::table('departments')->where('id', 3)->update(['head_teacher_id' => $teachers[4]->id]);

        // 3. Students (12 total)
        $students = [];
        for ($i = 1; $i <= 12; $i++) {
            $user = User::factory()->create([
                'name' => fake()->name('male'),
                'email' => 'student' . $i . '@arabiccollege.edu',
                'password' => Hash::make('password'),
            ]);
            $user->assignRole('Student');

            // Distribute across programs (1 = B-SHARIA, 2 = B-ARABIC, 3 = B-HADITH)
            $programId = ($i % 3) + 1;

            $students[] = Student::factory()->create([
                'user_id' => $user->id,
                'program_id' => $programId,
                'admission_semester_id' => 1, // Fall 2025
                'status_id' => 1, // Active student
            ]);
        }

        // 4. Applicants & Applications (5 total)
        for ($i = 1; $i <= 5; $i++) {
            $user = User::factory()->create([
                'name' => fake()->name(),
                'email' => 'applicant' . $i . '@gmail.com',
                'password' => Hash::make('password'),
            ]);
            $user->assignRole('Applicant');

            $applicant = Applicant::factory()->create([
                'user_id' => $user->id,
            ]);

            Application::create([
                'applicant_id' => $applicant->id,
                'program_id' => ($i % 3) + 1,
                'academic_year_id' => 2, // 2026/2027 intake
                'status_id' => fake()->numberBetween(1, 3), // Submitted, Under Review, Approved
                'applied_date' => now()->subDays(fake()->numberBetween(5, 30)),
                'remarks' => fake()->sentence(),
            ]);
        }

        // 5. Courses (Sections)
        // Let's create sections for the 6 subjects in active Fall Semester 2026 (ID: 3)
        $courses = [];
        $subjects = DB::table('subjects')->get();
        foreach ($subjects as $index => $subject) {
            // Pick a teacher based on department
            $teacher = collect($teachers)->first(fn($t) => $t->department_id === $subject->department_id) ?? $teachers[0];

            $courses[] = Course::create([
                'subject_id' => $subject->id,
                'semester_id' => 3, // Fall 2026 (Active)
                'teacher_id' => $teacher->id,
                'code' => $subject->code . '-SEC1-2026',
                'section' => 'Section A',
                'capacity' => 40,
            ]);
        }

        // 6. Student Enrollments
        // Enroll students in courses matching their department/program
        foreach ($students as $student) {
            // Find courses for this student's program (mapped by department)
            $prog = DB::table('programs')->find($student->program_id);
            $matchedCourses = collect($courses)->filter(function($c) use ($prog) {
                return $c->subject->department_id === $prog->department_id;
            });

            foreach ($matchedCourses as $course) {
                StudentCourseEnrollment::create([
                    'student_id' => $student->id,
                    'course_id' => $course->id,
                    'status_id' => 1, // Active enrollment
                    'enrolled_at' => now(),
                ]);

                // Create some student attendance entries
                // 3 days of attendance
                for ($d = 1; $d <= 3; $d++) {
                    StudentAttendance::create([
                        'student_id' => $student->id,
                        'course_id' => $course->id,
                        'attendance_date' => now()->subDays($d),
                        'status_id' => fake()->randomElement([1, 1, 1, 3]), // 1 = Present (75%), 3 = Late (25%)
                        'remarks' => fake()->optional(0.2)->sentence(),
                        'marked_by_user_id' => $course->teacher->user_id,
                    ]);
                }
            }
        }

        // 7. Staff Attendance (5 staff users checked in)
        $staffUsers = [$registrarUser1, $accountantUser, $librarianUser];
        foreach ($staffUsers as $su) {
            StaffAttendance::create([
                'user_id' => $su->id,
                'attendance_date' => now(),
                'clock_in' => '08:00:00',
                'clock_out' => '16:00:00',
                'status_id' => 1, // Present
                'remarks' => 'Regular check-in',
            ]);
        }

        // 8. Examinations & Results
        // Create a Midterm and a Final Exam for each course
        foreach ($courses as $course) {
            $midterm = Examination::create([
                'course_id' => $course->id,
                'exam_type_id' => 2, // Midterm
                'name' => 'Midterm Examination',
                'exam_date' => now()->subWeeks(2),
                'max_marks' => 30.00,
                'weightage_percentage' => 30.00,
            ]);

            $final = Examination::create([
                'course_id' => $course->id,
                'exam_type_id' => 3, // Final Exam
                'name' => 'Final Examination',
                'exam_date' => now()->addWeeks(4),
                'max_marks' => 70.00,
                'weightage_percentage' => 70.00,
            ]);

            // Grade Midterm for all enrolled students
            $enrollments = StudentCourseEnrollment::where('course_id', $course->id)->get();
            foreach ($enrollments as $enrollment) {
                $score = fake()->randomFloat(2, 18, 30); // Score between 60% and 100%
                ExamResult::create([
                    'examination_id' => $midterm->id,
                    'student_id' => $enrollment->student_id,
                    'marks_obtained' => $score,
                    'grade_id' => $score >= 28.5 ? 1 : ($score >= 27 ? 2 : ($score >= 25.5 ? 3 : 4)), // A+, A, B+, B approx
                    'remarks' => 'Good performance',
                    'graded_by_user_id' => $course->teacher->user_id,
                ]);
            }
        }

        // 9. Research Projects
        $research = ResearchProject::create([
            'title' => 'Compiling Classical Arabic Lexicons in digital databases',
            'abstract' => 'An academic effort to map historical lexicology tools to relational database constraints.',
            'department_id' => 2, // Arabic Language department
            'status_id' => 2, // In Progress
            'budget' => 45000.00,
            'start_date' => now()->subMonths(6),
        ]);

        ResearchMember::create([
            'research_project_id' => $research->id,
            'user_id' => $teachers[2]->user_id, // Teacher 3
            'role' => 'Principal Investigator',
            'joined_at' => now()->subMonths(6),
        ]);

        ResearchMember::create([
            'research_project_id' => $research->id,
            'user_id' => $students[0]->user_id, // Student 1 as research assistant
            'role' => 'Research Assistant',
            'joined_at' => now()->subMonths(3),
        ]);

        ResearchPublication::create([
            'research_project_id' => $research->id,
            'title' => 'Digital Lexicography: Historical Challenges and Relational Solutions',
            'authors' => 'Sheikh Dr. ' . $teachers[2]->user->name . ', ' . $students[0]->user->name,
            'journal_name' => 'Journal of Arabic Computational Linguistics',
            'publication_date' => now()->subMonths(1),
            'doi_number' => '10.1000/jacl.2026.01',
            'url' => 'https://example.org/jacl/article-01',
        ]);

        // 10. Library
        Book::factory(15)->create();

        // Let students borrow books
        $books = Book::all();
        for ($i = 0; $i < 5; $i++) {
            $book = $books[$i];
            $student = $students[$i];

            LibraryBorrow::create([
                'book_id' => $book->id,
                'user_id' => $student->user_id,
                'borrow_date' => now()->subDays(10),
                'due_date' => now()->addDays(4),
                'status_id' => 1, // Borrowed
                'issued_by_staff_id' => $librarianStaff->id,
            ]);

            // Decrement copy
            $book->decrement('available_copies');
        }

        // 11. Finance
        foreach ($students as $index => $student) {
            $invoiceNum = 'INV-2026-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
            $invoice = StudentInvoice::create([
                'student_id' => $student->id,
                'semester_id' => 3, // Fall 2026
                'invoice_number' => $invoiceNum,
                'total_amount' => 1250.00,
                'due_date' => now()->addDays(30),
                'status_id' => ($index % 2 === 0) ? 3 : 1, // Alternating Paid/Unpaid
            ]);

            // Invoice items
            StudentInvoiceItem::create([
                'student_invoice_id' => $invoice->id,
                'fee_category_id' => 1, // Tuition Fee
                'amount' => 1000.00,
                'description' => 'Tuition fee for Fall Semester 2026',
            ]);

            StudentInvoiceItem::create([
                'student_invoice_id' => $invoice->id,
                'fee_category_id' => 3, // Exam Fee
                'amount' => 200.00,
                'description' => 'Standard Semester Examination Fee',
            ]);

            StudentInvoiceItem::create([
                'student_invoice_id' => $invoice->id,
                'fee_category_id' => 4, // Library Fee
                'amount' => 50.00,
                'description' => 'Semester Library catalog access fee',
            ]);

            // If Paid, create transaction
            if ($invoice->status_id === 3) {
                FinancialTransaction::create([
                    'transaction_type_id' => 1, // Credit (Income)
                    'amount' => 1250.00,
                    'transaction_date' => now()->subDays(2),
                    'payment_method_id' => fake()->numberBetween(1, 3), // Cash, Bank, Card
                    'reference_number' => 'REF-' . Str::random(8),
                    'invoice_id' => $invoice->id,
                    'description' => 'Invoice payment for ' . $invoiceNum,
                    'handled_by_staff_id' => $accountantStaff->id,
                ]);
            }
        }

        // 12. Settings
        Setting::create([
            'key' => 'college_name_en',
            'value' => 'Arabic College of Sharia and Linguistic Sciences',
            'type' => 'string',
            'description' => 'English official name of the institution',
        ]);
        Setting::create([
            'key' => 'college_name_ar',
            'value' => 'كلية العلوم الشرعية واللغوية العربية',
            'type' => 'string',
            'description' => 'Arabic official name of the institution',
        ]);
        Setting::create([
            'key' => 'admissions_open',
            'value' => 'true',
            'type' => 'boolean',
            'description' => 'Toggle applicant portal registrations',
        ]);

        // 13. Backups
        Backup::create([
            'file_name' => 'database_backup_2026_06_29.sql',
            'file_path' => '/storage/backups/database_backup_2026_06_29.sql',
            'file_size_bytes' => 1524382,
            'backup_status_id' => 1, // Success
            'initiated_by_user_id' => $adminUser->id,
        ]);

        // 14. Documents
        foreach ($students as $student) {
            Document::create([
                'user_id' => $student->user_id,
                'document_type_id' => 1, // Identification
                'file_name' => 'national_id_' . $student->student_id_number . '.pdf',
                'file_path' => '/storage/documents/' . $student->user_id . '/national_id.pdf',
                'file_size' => 452932,
                'mime_type' => 'application/pdf',
                'verified_at' => now()->subMonths(1),
                'verified_by_user_id' => $adminUser->id,
            ]);
        }

        // 15. Notifications
        $notif = SystemNotification::create([
            'notification_type_id' => 2, // Academic
            'title' => 'Midterm Grading Period Commencing',
            'message' => 'Please note that all grading for Midterm Examinations must be submitted via the portal by July 15th.',
            'sender_user_id' => $adminUser->id,
        ]);

        // User Notification receipts for teachers
        foreach ($teachers as $t) {
            UserNotification::create([
                'notification_id' => $notif->id,
                'user_id' => $t->user_id,
                'read_at' => now(),
            ]);
        }

        // 16. Audit Logs
        AuditLog::create([
            'user_id' => $adminUser->id,
            'action' => 'updated',
            'model_type' => 'Setting',
            'model_id' => 3,
            'new_values' => ['admissions_open' => 'true'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);
    }
}
