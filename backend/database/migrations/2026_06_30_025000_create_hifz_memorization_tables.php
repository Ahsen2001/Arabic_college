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
        // 1. Student Hifz Progress tracking completion %
        Schema::create('student_hifz_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->unique()->constrained('students')->onDelete('cascade');
            $table->unsignedTinyInteger('current_juz')->default(1);
            $table->unsignedTinyInteger('current_surah')->default(1);
            $table->unsignedSmallInteger('current_ayah')->default(1);
            $table->decimal('completion_percentage', 5, 2)->default(0.00); // 0.00 to 100.00
            $table->timestamps();

            $table->index('student_id');
        });

        // 2. Daily Hifz log entries (Sabaq, Sabki, Manzil)
        Schema::create('hifz_daily_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->date('log_date');
            
            // Sabaq (New lesson memorized today)
            $table->string('sabaq_surah')->nullable();
            $table->unsignedInteger('sabaq_ayah_start')->nullable();
            $table->unsignedInteger('sabaq_ayah_end')->nullable();
            $table->string('sabaq_status')->nullable(); // Excellent, Good, Needs Practice
            
            // Sabki (Recent revision - last 5-10 pages)
            $table->unsignedTinyInteger('sabki_juz')->nullable();
            $table->unsignedInteger('sabki_page_start')->nullable();
            $table->unsignedInteger('sabki_page_end')->nullable();
            $table->string('sabki_status')->nullable();
            
            // Manzil (Old revision - e.g. 1 Juz)
            $table->unsignedTinyInteger('manzil_juz')->nullable();
            $table->string('manzil_status')->nullable();

            // Quality metrics
            $table->unsignedInteger('mistakes_count')->default(0);
            $table->unsignedTinyInteger('tajweed_score')->default(100); // 0-100 scale
            $table->text('teacher_remarks')->nullable();
            $table->foreignId('marked_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('student_id');
            $table->index('log_date');
        });

        // 3. Weekly / Monthly Hifz Assessments
        Schema::create('hifz_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('assessment_type'); // e.g. 'weekly', 'monthly'
            $table->date('assessment_date');
            $table->string('juz_tested'); // e.g. "Juz 1-5" or "Juz 30"
            $table->decimal('memorization_score', 5, 2);
            $table->decimal('tajweed_score', 5, 2);
            $table->string('grade'); // e.g. A, B, C, D, F
            $table->text('remarks')->nullable();
            $table->foreignId('assessed_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('student_id');
        });

        // 4. Hifz Major Milestones (e.g. 5 Juz, 15 Juz, Full Quran Khatm)
        Schema::create('hifz_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('milestone_name'); // e.g. "5 Juz Completion", "10 Juz Completion", "Full Quran Memorization (Khatm)"
            $table->date('completion_date');
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hifz_milestones');
        Schema::dropIfExists('hifz_assessments');
        Schema::dropIfExists('hifz_daily_logs');
        Schema::dropIfExists('student_hifz_progress');
    }
};
