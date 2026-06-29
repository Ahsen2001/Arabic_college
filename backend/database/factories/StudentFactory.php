<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'student_id_number' => 'STU' . date('Y') . fake()->unique()->numberBetween(1000, 9999),
            'program_id' => 1, // Will be overridden in seeder
            'admission_semester_id' => 1, // Will be overridden in seeder
            'status_id' => 1, // Active student
            'admission_date' => fake()->date('Y-m-d', '-1 years'),
        ];
    }
}
