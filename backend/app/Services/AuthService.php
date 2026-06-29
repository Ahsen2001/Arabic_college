<?php

namespace App\Services;

use App\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    protected UserRepositoryInterface $userRepository;

    /**
     * AuthService constructor.
     *
     * @param UserRepositoryInterface $userRepository
     */
    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Authenticate user credentials and issue token.
     *
     * @param array $credentials
     * @param string $device
     * @return array
     * @throws ValidationException
     */
    public function login(array $credentials, string $device = 'web'): array
    {
        $user = $this->userRepository->findByEmail($credentials['email']);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('messages.auth.failed')],
            ]);
        }

        $token = $user->createToken($device)->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Logout user by revoking token.
     *
     * @param mixed $user
     * @return bool
     */
    public function logout(mixed $user): bool
    {
        if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            return $user->currentAccessToken()->delete();
        }
        return false;
    }
}
