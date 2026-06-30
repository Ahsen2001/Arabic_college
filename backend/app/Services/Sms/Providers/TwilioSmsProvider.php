<?php

namespace App\Services\Sms\Providers;

use App\Services\Sms\SmsProviderInterface;
use Illuminate\Support\Facades\Log;

class TwilioSmsProvider implements SmsProviderInterface
{
    protected string $accountSid;
    protected string $authToken;
    protected string $fromNumber;

    public function __construct()
    {
        $this->accountSid = config('services.twilio.sid', 'AC_MOCK_SID_12345');
        $this->authToken = config('services.twilio.token', 'MOCK_TOKEN_abcde');
        $this->fromNumber = config('services.twilio.from', '+15551234567');
    }

    /**
     * Send SMS mock API dispatcher.
     */
    public function send(string $to, string $message): bool
    {
        // Mocking Twilio API dispatch logging details
        Log::info("SMS DISPATCHED [Driver: Twilio] From: {$this->fromNumber} To: {$to} | SID: {$this->accountSid} | Content: {$message}");
        return true;
    }
}
