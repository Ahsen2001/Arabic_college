<?php

namespace Database\Factories;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
{
    protected $model = Teacher::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'teacher_id_number' => 'TEA' . date('Y') . fake()->unique()->numberBetween(1000, 9999),
            'department_id' => 1, // Will be overridden in seeder
            'designation_id' => fake()->numberBetween(1, 4), // Professor, Assoc Prof, Asst Prof, Lecturer
            'status_id' => 1, // Active teacher
            'specialization' => fake()->randomElement(['Arabic Linguistics', 'Islamic Jurisprudence (Fiqh)', 'Hadith Studies', 'Quranic Tafseer']),
            'joining_date' => fake()->date('Y-m-d', '-5 years'),
        ];
    }
}
