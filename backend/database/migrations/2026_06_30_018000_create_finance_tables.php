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
        // 1. Student Invoices
        Schema::create('student_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('semester_id')->constrained('semesters')->onDelete('restrict');
            $table->string('invoice_number')->unique(); // e.g. INV-2026-0001
            $table->decimal('total_amount', 10, 2);
            $table->date('due_date');
            $table->unsignedTinyInteger('status_id');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('invoice_statuses')->onDelete('restrict');
            $table->index('student_id');
            $table->index('semester_id');
            $table->index('invoice_number');
            $table->index('status_id');
        });

        // 2. Student Invoice Items
        Schema::create('student_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_invoice_id')->constrained('student_invoices')->onDelete('cascade');
            $table->unsignedTinyInteger('fee_category_id');
            $table->decimal('amount', 10, 2);
            $table->string('description')->nullable();
            $table->timestamps();

            $table->foreign('fee_category_id')->references('id')->on('fee_categories')->onDelete('restrict');
            $table->index('student_invoice_id');
            $table->index('fee_category_id');
        });

        // 3. Financial Transactions
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('transaction_type_id'); // Credit/Debit
            $table->decimal('amount', 12, 2);
            $table->date('transaction_date');
            $table->unsignedTinyInteger('payment_method_id');
            $table->string('reference_number')->nullable(); // Check no, Txn ID, etc.
            $table->foreignId('invoice_id')->nullable()->constrained('student_invoices')->onDelete('set null');
            $table->string('description')->nullable();
            $table->foreignId('handled_by_staff_id')->nullable()->constrained('staff')->onDelete('set null');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('transaction_type_id')->references('id')->on('transaction_types')->onDelete('restrict');
            $table->foreign('payment_method_id')->references('id')->on('payment_methods')->onDelete('restrict');
            $table->index('transaction_type_id');
            $table->index('payment_method_id');
            $table->index('invoice_id');
            $table->index('handled_by_staff_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
        Schema::dropIfExists('student_invoice_items');
        Schema::dropIfExists('student_invoices');
    }
};
