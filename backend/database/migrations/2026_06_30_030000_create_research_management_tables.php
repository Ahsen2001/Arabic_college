<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Research Papers
        if (!Schema::hasTable('research_papers')) {
            Schema::create('research_papers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('supervisor_user_id')->nullable()->constrained('users')->onDelete('set null');
                $table->string('title');
                $table->text('abstract')->nullable();
                $table->string('category')->default('General'); // Sharia, Hadith, Arabic, Tafsir, etc.
                $table->string('keywords')->nullable();         // comma separated tags
                $table->enum('status', ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'])->default('Draft');
                $table->text('remarks')->nullable();           // Review remarks from supervisor
                $table->timestamps();
                $table->softDeletes();

                $table->index('user_id');
                $table->index('supervisor_user_id');
                $table->index('status');
                $table->index('category');
            });
        }

        // 2. Research Paper Versions (History)
        if (!Schema::hasTable('research_paper_versions')) {
            Schema::create('research_paper_versions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('research_paper_id')->constrained('research_papers')->onDelete('cascade');
                $table->unsignedInteger('version_number')->default(1);
                $table->string('file_path');
                $table->string('original_filename');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index('research_paper_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('research_paper_versions');
        Schema::dropIfExists('research_papers');
    }
};
