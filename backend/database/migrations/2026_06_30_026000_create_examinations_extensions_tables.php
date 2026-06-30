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
        // 1. Add is_published to examinations table
        Schema::table('examinations', function (Blueprint $table) {
            $table->boolean('is_published')->default(false)->after('weightage_percentage');
        });

        // 2. Exam Recheck Requests
        Schema::create('exam_recheck_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_result_id')->constrained('exam_results')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->text('reason');
            $table->string('status')->default('Pending'); // Pending, Approved, Rejected
            $table->decimal('new_marks', 5, 2)->nullable();
            $table->text('teacher_remarks')->nullable();
            $table->timestamps();

            $table->index('student_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_recheck_requests');

        Schema::table('examinations', function (Blueprint $table) {
            $table->dropColumn('is_published');
        });
    }
};
