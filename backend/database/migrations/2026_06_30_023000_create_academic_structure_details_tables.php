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
        // 1. Subject Prerequisites (many-to-many pivot)
        Schema::create('subject_prerequisites', function (Blueprint $table) {
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('prerequisite_subject_id')->constrained('subjects')->onDelete('cascade');

            $table->primary(['subject_id', 'prerequisite_subject_id']);
            $table->index('subject_id');
            $table->index('prerequisite_subject_id');
        });

        // 2. Program Curriculum Items
        Schema::create('curriculum_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->unsignedTinyInteger('semester_period'); // Recommended semester index (e.g. Semester 1, Semester 2)
            $table->boolean('is_elective')->default(false);
            $table->timestamps();

            $table->unique(['program_id', 'subject_id'], 'curriculum_prog_sub_unique');
            $table->index('program_id');
            $table->index('subject_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curriculum_items');
        Schema::dropIfExists('subject_prerequisites');
    }
};
