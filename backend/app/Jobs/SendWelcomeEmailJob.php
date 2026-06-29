<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendWelcomeEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected User $user;

    /**
     * Create a new job instance.
     *
     * @param User $user
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // For a production-ready system, we'd use a dedicated Mailable, e.g.:
        // Mail::to($this->user->email)->send(new \App\Mail\WelcomeMail($this->user));
        
        // Mock sending welcome email using Laravel Mail inline for demonstration
        Mail::raw(__('messages.welcome') . ' ' . $this->user->name, function ($message) {
            $message->to($this->user->email)
                    ->subject('Welcome to Arabic College Management System');
        });
    }
}
