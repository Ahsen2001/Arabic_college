<?php

namespace App\Services\Sms;

use App\Services\Sms\Providers\LogSmsProvider;
use App\Services\Sms\Providers\TwilioSmsProvider;
use InvalidArgumentException;

class SmsManager
{
    /**
     * Resolve the active SMS driver.
     *
     * @return SmsProviderInterface
     */
    public static function resolveDriver(): SmsProviderInterface
    {
        $driver = env('SMS_PROVIDER', 'log');

        switch (strtolower($driver)) {
            case 'log':
                return new LogSmsProvider();
            case 'twilio':
                return new TwilioSmsProvider();
            default:
                throw new InvalidArgumentException("Unsupported SMS driver type: {$driver}");
        }
    }
}
