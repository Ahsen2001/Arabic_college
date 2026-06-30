<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LookupTablesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Simple insert helper
        $seedSimpleLookup = function (string $table, array $items) {
            foreach ($items as $index => $item) {
                DB::table($table)->updateOrInsert(
                    ['id' => $index + 1],
                    ['name' => $item, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        };

        // 1. User Statuses
        $seedSimpleLookup('user_statuses', ['Active', 'Inactive', 'Suspended']);

        // 2. Genders
        $seedSimpleLookup('genders', ['Male', 'Female', 'Other']);

        // 3. Applicant Statuses
        $seedSimpleLookup('applicant_statuses', ['Draft', 'Submitted', 'Under Review', 'Interview', 'Selected', 'Rejected', 'Enrolled']);

        // 4. Student Statuses
        $seedSimpleLookup('student_statuses', ['Active', 'Graduated', 'Suspended', 'Withdrawn']);

        // 5. Enrollment Statuses
        $seedSimpleLookup('enrollment_statuses', ['Active', 'Completed', 'Dropped', 'Failed']);

        // 6. Teacher Statuses
        $seedSimpleLookup('teacher_statuses', ['Active', 'On Leave', 'Resigned', 'Suspended']);

        // 7. Designations (Academic roles)
        $seedSimpleLookup('designations', ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Teaching Assistant']);

        // 8. Staff Statuses
        $seedSimpleLookup('staff_statuses', ['Active', 'On Leave', 'Resigned']);

        // 9. Staff Roles (Administrative)
        $seedSimpleLookup('staff_roles', ['Administrator', 'Accountant', 'Librarian', 'HR Officer', 'IT Specialist', 'Registrar']);

        // 10. Attendance Statuses
        $seedSimpleLookup('attendance_statuses', ['Present', 'Absent', 'Late', 'Excused']);

        // 11. Exam Types
        $seedSimpleLookup('exam_types', ['Quiz', 'Midterm', 'Final', 'Assignment', 'Practical']);

        // 12. Grades (Grade Letter, min_score, max_score, GPA)
        $grades = [
            ['letter_grade' => 'A+', 'min_score' => 95.00, 'max_score' => 100.00, 'gpa_value' => 4.00, 'description' => 'Excellent Plus'],
            ['letter_grade' => 'A',  'min_score' => 90.00, 'max_score' => 94.99,  'gpa_value' => 3.75, 'description' => 'Excellent'],
            ['letter_grade' => 'B+', 'min_score' => 85.00, 'max_score' => 89.99,  'gpa_value' => 3.50, 'description' => 'Very Good Plus'],
            ['letter_grade' => 'B',  'min_score' => 80.00, 'max_score' => 84.99,  'gpa_value' => 3.00, 'description' => 'Very Good'],
            ['letter_grade' => 'C+', 'min_score' => 75.00, 'max_score' => 79.99,  'gpa_value' => 2.50, 'description' => 'Good Plus'],
            ['letter_grade' => 'C',  'min_score' => 70.00, 'max_score' => 74.99,  'gpa_value' => 2.00, 'description' => 'Good'],
            ['letter_grade' => 'D',  'min_score' => 60.00, 'max_score' => 69.99,  'gpa_value' => 1.00, 'description' => 'Pass'],
            ['letter_grade' => 'F',  'min_score' => 0.00,  'max_score' => 59.99,  'gpa_value' => 0.00, 'description' => 'Fail'],
        ];
        foreach ($grades as $index => $grade) {
            DB::table('grades')->updateOrInsert(
                ['id' => $index + 1],
                array_merge($grade, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 13. Research Project Statuses
        $seedSimpleLookup('research_project_statuses', ['Proposed', 'In Progress', 'Completed', 'Terminated']);

        // 14. Book Categories
        $categories = [
            ['name' => 'Islamic Law (Fiqh)', 'code' => 'ISL-LAW'],
            ['name' => 'Arabic Linguistics & Literature', 'code' => 'AR-LIT'],
            ['name' => 'Quranic Studies (Tafseer)', 'code' => 'QUR-STD'],
            ['name' => 'Hadith Studies', 'code' => 'HAD-STD'],
            ['name' => 'Islamic History & Culture', 'code' => 'ISL-HST'],
            ['name' => 'General Science & Languages', 'code' => 'GEN-SCI'],
        ];
        foreach ($categories as $index => $cat) {
            DB::table('book_categories')->updateOrInsert(
                ['id' => $index + 1],
                array_merge($cat, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 15. Borrow Statuses
        $seedSimpleLookup('borrow_statuses', ['Borrowed', 'Returned', 'Overdue', 'Lost']);

        // 16. Transaction Types (Credit/Debit)
        $seedSimpleLookup('transaction_types', ['Credit (Income)', 'Debit (Expense)']);

        // 17. Invoice Statuses
        $seedSimpleLookup('invoice_statuses', ['Unpaid', 'Partially Paid', 'Paid', 'Cancelled']);

        // 18. Payment Methods
        $seedSimpleLookup('payment_methods', ['Cash', 'Bank Transfer', 'Credit Card', 'Check']);

        // 19. Document Types
        $seedSimpleLookup('document_types', ['Identification', 'Academic Transcript', 'CV', 'Passport Photo', 'Certificate']);

        // 20. Notification Types
        $seedSimpleLookup('notification_types', ['System', 'Academic', 'Financial', 'Library', 'Administrative']);

        // 21. Backup Statuses
        $seedSimpleLookup('backup_statuses', ['Success', 'Failed', 'In Progress']);

        // 22. Fee Categories
        $seedSimpleLookup('fee_categories', ['Tuition Fee', 'Admission Fee', 'Exam Fee', 'Library Fee', 'Late Payment Fine']);
    }
}
