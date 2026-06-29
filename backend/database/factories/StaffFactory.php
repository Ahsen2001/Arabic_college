<?php

namespace Database\Factories;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Staff>
 */
class StaffFactory extends Factory
{
    protected $model = Staff::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'staff_id_number' => 'STF' . date('Y') . fake()->unique()->numberBetween(1000, 9999),
            'department_id' => null, // Typically non-academic or general admin
            'staff_role_id' => fake()->numberBetween(1, 6), // Admin, Accountant, Librarian, HR, IT, Registrar
            'status_id' => 1, // Active staff
            'joining_date' => fake()->date('Y-m-d', '-3 years'),
        ];
    }
}
