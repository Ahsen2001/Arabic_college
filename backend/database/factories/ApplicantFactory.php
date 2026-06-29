<?php

namespace Database\Factories;

use App\Models\Applicant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Applicant>
 */
class ApplicantFactory extends Factory
{
    protected $model = Applicant::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'application_number' => 'APP-' . fake()->unique()->numberBetween(100000, 999999),
            'date_of_birth' => fake()->date('Y-m-d', '-18 years'),
            'gender_id' => fake()->numberBetween(1, 2), // 1 = Male, 2 = Female
            'contact_number' => fake()->phoneNumber(),
            'address' => fake()->address(),
        ];
    }
}
