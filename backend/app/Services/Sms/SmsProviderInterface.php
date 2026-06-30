<?php

namespace App\Services\Sms;

interface SmsProviderInterface
{
    /**
     * Send an SMS message.
     *
     * @param string $to Recipient phone number.
     * @param string $message The text message to send.
     * @return bool True on success, false on failure.
     */
    public function send(string $to, string $message): bool;
}
