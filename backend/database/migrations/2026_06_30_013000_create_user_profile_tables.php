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
        // 1. Applicants
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('application_number')->unique();
            $table->date('date_of_birth');
            $table->unsignedTinyInteger('gender_id');
            $table->string('contact_number');
            $table->text('address');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('gender_id')->references('id')->on('genders')->onDelete('restrict');
            $table->index('gender_id');
            $table->index('application_number');
        });

        // 2. Students
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('student_id_number')->unique(); // e.g. STU20260001
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');
            $table->foreignId('admission_semester_id')->constrained('semesters')->onDelete('restrict');
            $table->unsignedTinyInteger('status_id');
            $table->date('admission_date');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('student_statuses')->onDelete('restrict');
            $table->index('status_id');
            $table->index('student_id_number');
            $table->index('program_id');
        });

        // 3. Teachers
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('teacher_id_number')->unique(); // e.g. TEA20260001
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->unsignedTinyInteger('designation_id');
            $table->unsignedTinyInteger('status_id');
            $table->string('specialization')->nullable();
            $table->date('joining_date');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('designation_id')->references('id')->on('designations')->onDelete('restrict');
            $table->foreign('status_id')->references('id')->on('teacher_statuses')->onDelete('restrict');
            $table->index('designation_id');
            $table->index('status_id');
            $table->index('teacher_id_number');
            $table->index('department_id');
        });

        // 4. Staff
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('staff_id_number')->unique(); // e.g. STF20260001
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('restrict');
            $table->unsignedTinyInteger('staff_role_id');
            $table->unsignedTinyInteger('status_id');
            $table->date('joining_date');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('staff_role_id')->references('id')->on('staff_roles')->onDelete('restrict');
            $table->foreign('status_id')->references('id')->on('staff_statuses')->onDelete('restrict');
            $table->index('staff_role_id');
            $table->index('status_id');
            $table->index('staff_id_number');
        });

        // Resolve Circular Foreign Key Constraint on Departments table
        Schema::table('departments', function (Blueprint $table) {
            $table->foreign('head_teacher_id')->references('id')->on('teachers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['head_teacher_id']);
        });

        Schema::dropIfExists('staff');
        Schema::dropIfExists('teachers');
        Schema::dropIfExists('students');
        Schema::dropIfExists('applicants');
    }
};
