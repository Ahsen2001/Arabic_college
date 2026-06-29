<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Simple lookup helper to create standard id, name, description tables
        $createSimpleLookup = function (string $tableName) {
            Schema::create($tableName, function (Blueprint $table) {
                $table->tinyIncrements('id');
                $table->string('name')->unique();
                $table->string('description')->nullable();
                $table->timestamps();
            });
        };

        // 1. User Statuses
        $createSimpleLookup('user_statuses');

        // 2. Genders
        $createSimpleLookup('genders');

        // 3. Applicant Statuses
        $createSimpleLookup('applicant_statuses');

        // 4. Student Statuses
        $createSimpleLookup('student_statuses');

        // 5. Enrollment Statuses
        $createSimpleLookup('enrollment_statuses');

        // 6. Teacher Statuses
        $createSimpleLookup('teacher_statuses');

        // 7. Designations (Academic roles like Professor, Lecturer)
        $createSimpleLookup('designations');

        // 8. Staff Statuses
        $createSimpleLookup('staff_statuses');

        // 9. Staff Roles (Job roles like Admin, Registrar, Accountant)
        $createSimpleLookup('staff_roles');

        // 10. Attendance Statuses
        $createSimpleLookup('attendance_statuses');

        // 11. Exam Types
        $createSimpleLookup('exam_types');

        // 12. Grades (Letter grade, min_score, max_score, GPA weight)
        Schema::create('grades', function (Blueprint $table) {
            $table->tinyIncrements('id');
            $table->string('letter_grade', 10)->unique();
            $table->decimal('min_score', 5, 2);
            $table->decimal('max_score', 5, 2);
            $table->decimal('gpa_value', 3, 2);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 13. Research Project Statuses
        $createSimpleLookup('research_project_statuses');

        // 14. Book Categories
        Schema::create('book_categories', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->string('name')->unique();
            $table->string('code', 20)->unique(); // e.g. ISL-LAW, AR-LIT
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 15. Borrow Statuses
        $createSimpleLookup('borrow_statuses');

        // 16. Transaction Types (Credit/Debit)
        $createSimpleLookup('transaction_types');

        // 17. Invoice Statuses
        $createSimpleLookup('invoice_statuses');

        // 18. Payment Methods
        $createSimpleLookup('payment_methods');

        // 19. Document Types
        $createSimpleLookup('document_types');

        // 20. Notification Types
        $createSimpleLookup('notification_types');

        // 21. Backup Statuses
        $createSimpleLookup('backup_statuses');

        // 22. Fee Categories
        $createSimpleLookup('fee_categories');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_categories');
        Schema::dropIfExists('backup_statuses');
        Schema::dropIfExists('notification_types');
        Schema::dropIfExists('document_types');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('invoice_statuses');
        Schema::dropIfExists('transaction_types');
        Schema::dropIfExists('borrow_statuses');
        Schema::dropIfExists('book_categories');
        Schema::dropIfExists('research_project_statuses');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('exam_types');
        Schema::dropIfExists('attendance_statuses');
        Schema::dropIfExists('staff_roles');
        Schema::dropIfExists('staff_statuses');
        Schema::dropIfExists('designations');
        Schema::dropIfExists('teacher_statuses');
        Schema::dropIfExists('enrollment_statuses');
        Schema::dropIfExists('student_statuses');
        Schema::dropIfExists('applicant_statuses');
        Schema::dropIfExists('genders');
        Schema::dropIfExists('user_statuses');
    }
};
