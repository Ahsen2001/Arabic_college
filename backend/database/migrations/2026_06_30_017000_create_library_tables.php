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
        // 1. Books
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('category_id');
            $table->string('title');
            $table->string('authors');
            $table->string('publisher')->nullable();
            $table->string('isbn')->nullable()->unique();
            $table->unsignedSmallInteger('publication_year')->nullable();
            $table->unsignedSmallInteger('total_copies')->default(1);
            $table->unsignedSmallInteger('available_copies')->default(1);
            $table->string('shelf_location')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('book_categories')->onDelete('restrict');
            $table->index('category_id');
            $table->index('isbn');
        });

        // 2. Library Borrows
        Schema::create('library_borrows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('books')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->date('borrow_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();
            $table->unsignedTinyInteger('status_id');
            $table->decimal('fine_amount', 8, 2)->default(0.00);
            $table->foreignId('issued_by_staff_id')->nullable()->constrained('staff')->onDelete('set null');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('borrow_statuses')->onDelete('restrict');
            $table->index('book_id');
            $table->index('user_id');
            $table->index('status_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('library_borrows');
        Schema::dropIfExists('books');
    }
};
