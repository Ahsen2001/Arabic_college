<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add barcode column to books if it doesn't exist
        if (Schema::hasTable('books')) {
            Schema::table('books', function (Blueprint $table) {
                if (!Schema::hasColumn('books', 'barcode')) {
                    $table->string('barcode', 100)->nullable()->unique()->after('isbn');
                }
            });
        }

        // 2. Seed borrow_statuses
        $now = now();
        DB::table('borrow_statuses')->insertOrIgnore([
            ['id' => 1, 'name' => 'Issued',   'description' => 'Book is currently checked out', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'name' => 'Returned', 'description' => 'Book has been returned',        'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'name' => 'Overdue',  'description' => 'Book is past due date',         'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'name' => 'Lost',     'description' => 'Book is marked as lost',        'created_at' => $now, 'updated_at' => $now],
        ]);

        // 3. Seed book_categories default
        DB::table('book_categories')->insertOrIgnore([
            ['id' => 1, 'code' => 'ISL-LAW', 'name' => 'Islamic Jurisprudence (Fiqh)', 'description' => 'Books on Sharia law and rulings', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'code' => 'ISL-HIS', 'name' => 'Islamic History',              'description' => 'Historical accounts of early Islam', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'code' => 'AR-LANG', 'name' => 'Arabic Linguistics & Grammar', 'description' => 'Nahw, Sarf and Arabic syntax study', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'code' => 'HADITH',  'name' => 'Hadith Studies',               'description' => 'Collections and commentary of Hadith', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'code' => 'TAFSIR',  'name' => 'Quranic Exegesis (Tafsir)',    'description' => 'Tafsir of holy Quran', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 6, 'code' => 'GEN-SCI', 'name' => 'General Sciences',             'description' => 'Modern scientific literature', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        if (Schema::hasTable('books')) {
            Schema::table('books', function (Blueprint $table) {
                if (Schema::hasColumn('books', 'barcode')) {
                    $table->dropColumn('barcode');
                }
            });
        }
    }
};
