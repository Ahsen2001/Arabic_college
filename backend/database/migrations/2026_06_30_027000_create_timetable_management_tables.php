<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Classrooms / Rooms catalogue
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->string('name');                        // e.g. "Room 101", "Lecture Hall A"
            $table->string('building')->nullable();
            $table->string('type')->default('Classroom');  // Classroom, Lab, Hall, Seminar
            $table->unsignedSmallInteger('capacity')->default(30);
            $table->boolean('has_projector')->default(false);
            $table->boolean('has_ac')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
        });

        // 2. Extend timetable_allocations: add teacher FK + room FK
        //    The original migration stored classroom as a plain varchar.
        //    We add structured columns alongside it.
        Schema::table('timetable_allocations', function (Blueprint $table) {
            $table->foreignId('teacher_user_id')
                ->nullable()
                ->after('course_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('classroom_id')
                ->nullable()
                ->after('teacher_user_id')
                ->constrained('classrooms')
                ->nullOnDelete();

            $table->text('notes')->nullable()->after('classroom');
        });
    }

    public function down(): void
    {
        Schema::table('timetable_allocations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_user_id');
            $table->dropConstrainedForeignId('classroom_id');
            $table->dropColumn('notes');
        });

        Schema::dropIfExists('classrooms');
    }
};
