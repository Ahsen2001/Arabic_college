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
        // 1. Research Projects
        Schema::create('research_projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('abstract');
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->unsignedTinyInteger('status_id');
            $table->decimal('budget', 12, 2)->default(0.00);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('research_project_statuses')->onDelete('restrict');
            $table->index('department_id');
            $table->index('status_id');
        });

        // 2. Research Members
        Schema::create('research_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role'); // e.g. "Principal Investigator", "Research Assistant"
            $table->date('joined_at');
            $table->timestamps();

            $table->unique(['research_project_id', 'user_id']);
            $table->index('research_project_id');
            $table->index('user_id');
        });

        // 3. Research Publications
        Schema::create('research_publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->nullable()->constrained('research_projects')->onDelete('set null');
            $table->string('title');
            $table->string('authors'); // CSV list of author names
            $table->string('journal_name');
            $table->date('publication_date');
            $table->string('doi_number')->nullable()->unique();
            $table->string('url')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('research_project_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_publications');
        Schema::dropIfExists('research_members');
        Schema::dropIfExists('research_projects');
    }
};
