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
        // 1. Course Assignments
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('max_marks', 5, 2);
            $table->date('due_date');
            $table->timestamps();

            $table->index('course_id');
        });

        // 2. Assignment Student Submissions
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('assignments')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('file_path')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->decimal('marks_obtained', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->unique(['assignment_id', 'student_id']);
            $table->index('assignment_id');
            $table->index('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('assignments');
    }
};
