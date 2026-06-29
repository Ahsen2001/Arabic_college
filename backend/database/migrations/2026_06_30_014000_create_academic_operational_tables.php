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
        // 1. Courses (Course Sections)
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('restrict');
            $table->foreignId('semester_id')->constrained('semesters')->onDelete('restrict');
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->onDelete('set null');
            $table->string('code')->unique(); // e.g. HAD101-SEC1-2026
            $table->string('section'); // e.g. "Section A"
            $table->unsignedSmallInteger('capacity');
            $table->softDeletes();
            $table->timestamps();

            $table->index('subject_id');
            $table->index('semester_id');
            $table->index('teacher_id');
        });

        // 2. Student Course Enrollments
        Schema::create('student_course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->unsignedTinyInteger('status_id');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('enrollment_statuses')->onDelete('restrict');
            $table->unique(['student_id', 'course_id'], 'stu_course_enrollment_unique');
            $table->index('student_id');
            $table->index('course_id');
            $table->index('status_id');
        });

        // 3. Applications
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('applicants')->onDelete('cascade');
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('restrict');
            $table->unsignedTinyInteger('status_id');
            $table->date('applied_date');
            $table->text('remarks')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('applicant_statuses')->onDelete('restrict');
            $table->index('applicant_id');
            $table->index('program_id');
            $table->index('status_id');
        });

        // 4. Student Attendance
        Schema::create('student_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->date('attendance_date');
            $table->unsignedTinyInteger('status_id');
            $table->string('remarks')->nullable();
            $table->foreignId('marked_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('attendance_statuses')->onDelete('restrict');
            $table->unique(['student_id', 'course_id', 'attendance_date'], 'student_attendance_date_unique');
            $table->index('student_id');
            $table->index('course_id');
            $table->index('status_id');
        });

        // 5. Staff Attendance
        Schema::create('staff_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('attendance_date');
            $table->time('clock_in')->nullable();
            $table->time('clock_out')->nullable();
            $table->unsignedTinyInteger('status_id');
            $table->string('remarks')->nullable();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('attendance_statuses')->onDelete('restrict');
            $table->unique(['user_id', 'attendance_date']);
            $table->index('user_id');
            $table->index('status_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_attendance');
        Schema::dropIfExists('student_attendance');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('student_course_enrollments');
        Schema::dropIfExists('courses');
    }
};
