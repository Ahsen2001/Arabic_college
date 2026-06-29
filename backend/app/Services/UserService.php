<?php

namespace App\Services;

use App\Repositories\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class UserService extends BaseService
{
    /**
     * UserService constructor.
     *
     * @param UserRepositoryInterface $repository
     */
    public function __construct(UserRepositoryInterface $repository)
    {
        parent::__construct($repository);
    }

    /**
     * Create a new user and assign roles.
     *
     * @param array $data
     * @return Model
     */
    public function create(array $data): Model
    {
        $data['password'] = Hash::make($data['password']);
        
        $role = $data['role'] ?? null;
        unset($data['role']);

        $user = parent::create($data);

        if ($role && method_exists($user, 'assignRole')) {
            $user->assignRole($role);
        }

        return $user;
    }

    /**
     * Update user details and optionally sync roles.
     *
     * @param int|string $id
     * @param array $data
     * @return Model
     */
    public function update(int|string $id, array $data): Model
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $role = $data['role'] ?? null;
        unset($data['role']);

        $user = parent::update($id, $data);

        if ($role && method_exists($user, 'syncRoles')) {
            $user->syncRoles([$role]);
        }

        return $user;
    }
}
