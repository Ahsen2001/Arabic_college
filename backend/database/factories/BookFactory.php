<?php

namespace Database\Factories;

use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    protected $model = Book::class;

    public function definition(): array
    {
        $copies = fake()->numberBetween(2, 8);

        return [
            'category_id' => fake()->numberBetween(1, 6), // Islamic Law, Arabic Literature, etc.
            'title' => fake()->sentence(4),
            'authors' => fake()->name() . ', ' . fake()->name(),
            'publisher' => fake()->company(),
            'isbn' => fake()->unique()->isbn13(),
            'publication_year' => fake()->numberBetween(1990, 2024),
            'total_copies' => $copies,
            'available_copies' => $copies,
            'shelf_location' => 'Row ' . fake()->numberBetween(1, 15) . ' Shelf ' . fake()->randomLetter(),
        ];
    }
}
