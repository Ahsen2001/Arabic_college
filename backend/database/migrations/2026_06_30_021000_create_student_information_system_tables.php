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
        // 1. Student Guardians
        Schema::create('student_guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('name');
            $table->string('relationship');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address');
            $table->string('occupation')->nullable();
            $table->timestamps();

            $table->index('student_id');
        });

        // 2. Student Emergency Contacts
        Schema::create('student_emergency_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('name');
            $table->string('relationship');
            $table->string('phone');
            $table->string('alternate_phone')->nullable();
            $table->timestamps();

            $table->index('student_id');
        });

        // 3. Student Education Histories
        Schema::create('student_education_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('institution_name');
            $table->string('degree_diploma');
            $table->integer('passing_year');
            $table->string('gpa_percentage');
            $table->timestamps();

            $table->index('student_id');
        });

        // 4. Student Medical Records
        Schema::create('student_medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('blood_type');
            $table->text('allergies')->nullable();
            $table->text('chronic_conditions')->nullable();
            $table->text('emergency_notes')->nullable();
            $table->timestamps();

            $table->index('student_id');
        });

        // 5. Student Scholarships
        Schema::create('student_scholarships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('scholarship_name');
            $table->decimal('discount_percentage', 5, 2); // e.g., 100.00 for full waiver
            $table->date('award_date');
            $table->string('status'); // e.g. Active, Suspended, Inactive
            $table->timestamps();

            $table->index('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_scholarships');
        Schema::dropIfExists('student_medical_records');
        Schema::dropIfExists('student_education_histories');
        Schema::dropIfExists('student_emergency_contacts');
        Schema::dropIfExists('student_guardians');
    }
};
