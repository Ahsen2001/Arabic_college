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
        // 1. Examinations
        Schema::create('examinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->unsignedTinyInteger('exam_type_id');
            $table->string('name'); // e.g. "Midterm Exam 1"
            $table->date('exam_date');
            $table->decimal('max_marks', 5, 2);
            $table->decimal('weightage_percentage', 5, 2);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('exam_type_id')->references('id')->on('exam_types')->onDelete('restrict');
            $table->index('course_id');
            $table->index('exam_type_id');
        });

        // 2. Exam Results
        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examination_id')->constrained('examinations')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->decimal('marks_obtained', 5, 2);
            $table->unsignedTinyInteger('grade_id')->nullable();
            $table->string('remarks')->nullable();
            $table->foreignId('graded_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('grade_id')->references('id')->on('grades')->onDelete('restrict');
            $table->unique(['examination_id', 'student_id']);
            $table->index('examination_id');
            $table->index('student_id');
            $table->index('grade_id');
        });

        // 3. Student Semester GPAs
        Schema::create('student_semester_gpas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('semester_id')->constrained('semesters')->onDelete('restrict');
            $table->decimal('gpa', 4, 2);
            $table->unsignedSmallInteger('total_credits_attempted');
            $table->unsignedSmallInteger('total_credits_earned');
            $table->timestamps();

            $table->unique(['student_id', 'semester_id']);
            $table->index('student_id');
            $table->index('semester_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_semester_gpas');
        Schema::dropIfExists('exam_results');
        Schema::dropIfExists('examinations');
    }
};
