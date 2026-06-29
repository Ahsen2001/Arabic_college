<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'subject_id' => 1, // Override in seeder
            'semester_id' => 1, // Override in seeder
            'teacher_id' => 1, // Override in seeder
            'code' => 'CRS-' . strtoupper(fake()->unique()->lexify('???')) . '-' . fake()->numberBetween(100, 999),
            'section' => fake()->randomElement(['Section A', 'Section B', 'Section C']),
            'capacity' => fake()->randomElement([30, 40, 50]),
        ];
    }
}
