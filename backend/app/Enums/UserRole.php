<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case ACADEMIC_REGISTRY = 'academic_registry';
    case TEACHER = 'teacher';
    case STUDENT = 'student';
    case PARENT = 'parent';
    case ACCOUNTANT = 'accountant';

    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'مدير النظام (Admin)',
            self::ACADEMIC_REGISTRY => 'الشؤون الأكاديمية (Academic Registry)',
            self::TEACHER => 'أستاذ (Teacher)',
            self::STUDENT => 'طالب (Student)',
            self::PARENT => 'ولي أمر (Parent)',
            self::ACCOUNTANT => 'المحاسب (Accountant)',
        };
    }
}
