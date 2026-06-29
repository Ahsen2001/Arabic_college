<?php

namespace App\Repositories;

use App\Models\User;

interface UserRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find user by email.
     *
     * @param string $email
     * @return User|null
     */
    public function findByEmail(string $email): ?User;
}
