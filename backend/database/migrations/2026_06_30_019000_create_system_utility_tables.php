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
        // 1. Documents
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedTinyInteger('document_type_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->unsignedInteger('file_size'); // in bytes
            $table->string('mime_type');
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('document_type_id')->references('id')->on('document_types')->onDelete('restrict');
            $table->index('user_id');
            $table->index('document_type_id');
        });

        // 2. System Notifications
        Schema::create('system_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('notification_type_id');
            $table->string('title');
            $table->text('message');
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->foreign('notification_type_id')->references('id')->on('notification_types')->onDelete('restrict');
            $table->index('notification_type_id');
        });

        // 3. User Notifications (Pivot / Read status)
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('system_notifications')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->unique(['notification_id', 'user_id']);
            $table->index('notification_id');
            $table->index('user_id');
            $table->index('read_at');
        });

        // 4. Settings
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // e.g. string, boolean, integer, json
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index('key');
        });

        // 5. Backups
        Schema::create('backups', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size_bytes');
            $table->unsignedTinyInteger('backup_status_id');
            $table->foreignId('initiated_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('backup_status_id')->references('id')->on('backup_statuses')->onDelete('restrict');
            $table->index('backup_status_id');
        });

        // 6. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // e.g. created, updated, deleted, login
            $table->string('model_type')->nullable();
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('user_id');
            $table->index('created_at');
            $table->index('action');
            $table->index(['model_type', 'model_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('backups');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('system_notifications');
        Schema::dropIfExists('documents');
    }
};
