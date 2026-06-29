<?php

namespace App\Constants;

class AppConstants
{
    // Pagination defaults
    public const DEFAULT_PAGINATION_LIMIT = 15;
    public const MAX_PAGINATION_LIMIT = 100;

    // Date & Time Formats
    public const DATE_FORMAT = 'Y-m-d';
    public const DATETIME_FORMAT = 'Y-m-d H:i:s';
    public const TIME_FORMAT = 'H:i';

    // File Upload Configuration
    public const ALLOWED_IMAGE_EXTENSIONS = ['jpeg', 'png', 'jpg', 'gif', 'svg'];
    public const ALLOWED_DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
    public const MAX_FILE_SIZE = 10240; // 10MB in KB

    // Default Localization Settings
    public const DEFAULT_LOCALE = 'ar';
    public const SUPPORTED_LOCALES = ['ar', 'en'];

    // HTTP Headers
    public const LOCALE_HEADER = 'X-Locale';

    // Response Status Messages
    public const MSG_SUCCESS = 'success';
    public const MSG_ERROR = 'error';
}
