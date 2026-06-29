<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AcademicStructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Departments
        $departments = [
            [
                'name_ar' => 'قسم الشريعة الإسلامية',
                'name_en' => 'Department of Islamic Law (Sharia)',
                'code' => 'SHARIA',
            ],
            [
                'name_ar' => 'قسم اللغة العربية وآدابها',
                'name_en' => 'Department of Arabic Language and Literature',
                'code' => 'ARABIC',
            ],
            [
                'name_ar' => 'قسم علوم الحديث الشريف',
                'name_en' => 'Department of Hadith Sciences',
                'code' => 'HADITH',
            ],
        ];
        foreach ($departments as $index => $dept) {
            DB::table('departments')->updateOrInsert(
                ['id' => $index + 1],
                array_merge($dept, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 2. Seed Programs
        $programs = [
            [
                'department_id' => 1, // SHARIA
                'name_ar' => 'بكالوريوس في الفقه وأصوله',
                'name_en' => 'Bachelor of Islamic Jurisprudence (Fiqh & Usul)',
                'code' => 'B-SHARIA',
                'duration_years' => 4,
                'total_credits' => 132,
            ],
            [
                'department_id' => 2, // ARABIC
                'name_ar' => 'بكالوريوس في اللغة العربية وآدابها',
                'name_en' => 'Bachelor of Arabic Language and Literature',
                'code' => 'B-ARABIC',
                'duration_years' => 4,
                'total_credits' => 128,
            ],
            [
                'department_id' => 3, // HADITH
                'name_ar' => 'بكالوريوس في علوم الحديث الشريف',
                'name_en' => 'Bachelor of Hadith Sciences',
                'code' => 'B-HADITH',
                'duration_years' => 4,
                'total_credits' => 130,
            ],
        ];
        foreach ($programs as $index => $prog) {
            DB::table('programs')->updateOrInsert(
                ['id' => $index + 1],
                array_merge($prog, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 3. Seed Academic Years
        $academicYears = [
            [
                'name' => '2025/2026',
                'start_date' => '2025-09-01',
                'end_date' => '2026-06-30',
                'is_active' => false,
            ],
            [
                'name' => '2026/2027',
                'start_date' => '2026-09-01',
                'end_date' => '2027-06-30',
                'is_active' => true,
            ],
        ];
        foreach ($academicYears as $index => $year) {
            DB::table('academic_years')->updateOrInsert(
                ['id' => $index + 1],
                array_merge($year, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 4. Seed Semesters
        $semesters = [
            [
                'academic_year_id' => 1, // 2025/2026
                'name' => 'Fall Semester 2025',
                'code' => '2025-F',
                'start_date' => '2025-09-01',
                'end_date' => '2026-01-15',
                'is_active' => false,
            ],
            [
                'academic_year_id' => 1, // 2025/2026
                'name' => 'Spring Semester 2026',
                'code' => '2026-S',
                'start_date' => '2026-02-01',
                'end_date' => '2026-06-30',
                'is_active' => false,
            ],
            [
                'academic_year_id' => 2, // 2026/2027
                'name' => 'Fall Semester 2026',
                'code' => '2026-F',
                'start_date' => '2026-09-01',
                'end_date' => '2027-01-15',
                'is_active' => true, // Current active semester
            ],
        ];
        foreach ($semesters as $index => $sem) {
            DB::table('semesters')->updateOrInsert(
                ['id' => $index + 1],
                array_merge($sem, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 5. Seed Subjects
        $subjects = [
            // Sharia Department
            [
                'department_id' => 1,
                'name_ar' => 'مدخل إلى الفقه الإسلامي',
                'name_en' => 'Introduction to Islamic Jurisprudence',
                'code' => 'FIQH101',
                'credit_hours' => 3,
                'description' => 'Introduction to Fiqh origins, historical stages, and early schools.',
            ],
            [
                'department_id' => 1,
                'name_ar' => 'أصول الفقه ١',
                'name_en' => 'Principles of Jurisprudence I (Usul al-Fiqh)',
                'code' => 'USUL201',
                'credit_hours' => 3,
                'description' => 'Detailed study of Sharia rulings, commands, and prohibitions.',
            ],
            // Arabic Department
            [
                'department_id' => 2,
                'name_ar' => 'النحو العربي ١',
                'name_en' => 'Arabic Grammar I (Nahw)',
                'code' => 'ARAB101',
                'credit_hours' => 4,
                'description' => 'Core foundational studies in Arabic sentence structure and declensions.',
            ],
            [
                'department_id' => 2,
                'name_ar' => 'الصرف العربي',
                'name_en' => 'Arabic Morphology (Sarf)',
                'code' => 'ARAB102',
                'credit_hours' => 3,
                'description' => 'Detailed morphological patterns of nouns and verb conjugations.',
            ],
            // Hadith Department
            [
                'department_id' => 3,
                'name_ar' => 'مصطلح الحديث ١',
                'name_en' => 'Hadith Terminology I (Mustalah al-Hadith)',
                'code' => 'HADT101',
                'credit_hours' => 3,
                'description' => 'Study of hadith classification, terminology, and verification criteria.',
            ],
            [
                'department_id' => 3,
                'name_ar' => 'تخريج الحديث ودراسة الأسانيد',
                'name_en' => 'Hadith Extraction & Chain Study (Takhrij)',
                'code' => 'HADT202',
                'credit_hours' => 4,
                'description' => 'Practical training on tracing and criticizing chains of narration.',
            ],
        ];
        foreach ($subjects as $index => $sub) {
            DB::table('subjects')->updateOrInsert(
                ['id' => $index + 1],
                array_merge($sub, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
