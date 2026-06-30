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

        // Check if email is verified
        if (is_null($user->email_verified_at)) {
            $this->generateAndSendOtp($user->email, 'Email Verification');
            throw ValidationException::withMessages([
                'email' => ['email_unverified'],
            ]);
        }

        $token = $user->createToken($device)->plainTextToken;

        // Log successful login
        \App\Models\AuditLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Register a new user.
     *
     * @param array $data
     * @return array
     */
    public function register(array $data): array
    {
        $user = $this->userRepository->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'status_id' => 2, // Inactive / Pending OTP Verification
        ]);

        $this->generateAndSendOtp($user->email, 'Email Verification');

        return [
            'user' => $user,
        ];
    }

    /**
     * Verify the 6-digit OTP code for email verification.
     *
     * @param string $email
     * @param string $otp
     * @return bool
     * @throws ValidationException
     */
    public function verifyOtp(string $email, string $otp): bool
    {
        $record = \App\Models\EmailOtp::where('email', $email)
            ->where('otp', $otp)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'otp' => [__('Invalid or expired verification code.')],
            ]);
        }

        $user = $this->userRepository->findByEmail($email);
        if ($user) {
            $user->update([
                'email_verified_at' => now(),
                'status_id' => 1, // Active
            ]);

            // Assign default 'Applicant' Spatie role if they don't have any roles yet
            if ($user->roles()->count() === 0) {
                $user->assignRole('Applicant');
            }
        }

        $record->delete();

        return true;
    }

    /**
     * Resend the OTP verification code.
     *
     * @param string $email
     * @return bool
     * @throws ValidationException
     */
    public function resendOtp(string $email): bool
    {
        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => [__('No user found with this email address.')],
            ]);
        }

        $this->generateAndSendOtp($email, 'Email Verification');
        return true;
    }

    /**
     * Send an OTP code for resetting password.
     *
     * @param string $email
     * @return bool
     * @throws ValidationException
     */
    public function forgotPassword(string $email): bool
    {
        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => [__('No user found with this email address.')],
            ]);
        }

        $this->generateAndSendOtp($email, 'Password Reset');
        return true;
    }

    /**
     * Reset the user password using OTP verification.
     *
     * @param array $data
     * @return bool
     * @throws ValidationException
     */
    public function resetPassword(array $data): bool
    {
        $record = \App\Models\EmailOtp::where('email', $data['email'])
            ->where('otp', $data['otp'])
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'otp' => [__('Invalid or expired verification code.')],
            ]);
        }

        $user = $this->userRepository->findByEmail($data['email']);
        if ($user) {
            $user->update([
                'password' => Hash::make($data['password']),
            ]);
        }

        $record->delete();

        return true;
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
            \App\Models\AuditLog::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
            return $user->currentAccessToken()->delete();
        }
        return false;
    }

    /**
     * Helper to generate and send OTP mail.
     *
     * @param string $email
     * @param string $purpose
     * @return string
     */
    private function generateAndSendOtp(string $email, string $purpose): string
    {
        $otp = (string) rand(100000, 999999);
        $expiresAt = now()->addMinutes(15);

        // Delete any existing OTP for this email and purpose to keep table clean
        \App\Models\EmailOtp::where('email', $email)->delete();

        \App\Models\EmailOtp::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => $expiresAt,
        ]);

        \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\SendOtpMail($otp, $purpose));

        return $otp;
    }
}
