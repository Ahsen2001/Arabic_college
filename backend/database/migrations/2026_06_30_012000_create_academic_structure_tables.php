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
        // 1. Departments
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('code')->unique();
            $table->unsignedBigInteger('head_teacher_id')->nullable(); // Foreign key added later to prevent circular dependency
            $table->softDeletes();
            $table->timestamps();

            $table->index('code');
        });

        // 2. Programs
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('code')->unique();
            $table->unsignedTinyInteger('duration_years');
            $table->unsignedSmallInteger('total_credits');
            $table->softDeletes();
            $table->timestamps();

            $table->index('department_id');
            $table->index('code');
        });

        // 3. Academic Years
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g. "2025/2026"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->softDeletes();
            $table->timestamps();
        });

        // 4. Semesters
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('restrict');
            $table->string('name'); // e.g. "Semester 1"
            $table->string('code')->unique(); // e.g. "2025-S1"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->softDeletes();
            $table->timestamps();

            $table->index('academic_year_id');
            $table->index('code');
        });

        // 5. Subjects
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('code')->unique(); // e.g. "HAD101"
            $table->unsignedTinyInteger('credit_hours');
            $table->text('description')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('department_id');
            $table->index('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('semesters');
        Schema::dropIfExists('academic_years');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('departments');
    }
};
