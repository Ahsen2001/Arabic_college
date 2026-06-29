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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->unsignedTinyInteger('status_id')->default(1)->after('phone'); // 1 = Active
            $table->softDeletes()->after('updated_at');

            $table->foreign('status_id')->references('id')->on('user_statuses');
            $table->index('status_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['status_id']);
            $table->dropIndex(['status_id']);
            $table->dropColumn(['phone', 'status_id', 'deleted_at']);
        });
    }
};
