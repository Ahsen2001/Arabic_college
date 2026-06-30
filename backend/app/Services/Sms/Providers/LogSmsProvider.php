<?php

namespace App\Services\Sms\Providers;

use App\Services\Sms\SmsProviderInterface;
use Illuminate\Support\Facades\Log;

class LogSmsProvider implements SmsProviderInterface
{
    /**
     * Send SMS by logging it.
     */
    public function send(string $to, string $message): bool
    {
        Log::info("SMS DISPATCHED [Driver: Log] To: {$to} | Content: {$message}");
        return true;
    }
}
