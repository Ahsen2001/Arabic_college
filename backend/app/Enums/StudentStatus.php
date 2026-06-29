<?php

namespace App\Enums;

enum StudentStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case GRADUATED = 'graduated';
    case INACTIVE = 'inactive';

    public function label(): string
    {
        return match($this) {
            self::ACTIVE => 'نشط (Active)',
            self::SUSPENDED => 'موقوف (Suspended)',
            self::GRADUATED => 'خريج (Graduated)',
            self::INACTIVE => 'غير نشط (Inactive)',
        };
    }
}
