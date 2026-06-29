<?php

namespace App\Helpers;

use App\Constants\AppConstants;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class FileUploadHelper
{
    /**
     * Upload a file to storage.
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param string $disk
     * @return string Relative path to file
     */
    public static function upload(UploadedFile $file, string $folder = 'uploads', string $disk = 'public'): string
    {
        $extension = $file->getClientOriginalExtension();
        $allowedExtensions = array_merge(
            AppConstants::ALLOWED_IMAGE_EXTENSIONS,
            AppConstants::ALLOWED_DOC_EXTENSIONS
        );

        if (!in_array(strtolower($extension), $allowedExtensions, true)) {
            throw new InvalidArgumentException(__('messages.invalid_file_type'));
        }

        if ($file->getSize() > (AppConstants::MAX_FILE_SIZE * 1024)) {
            throw new InvalidArgumentException(__('messages.file_too_large'));
        }

        $fileName = Str::uuid() . '.' . $extension;
        $path = $file->storeAs($folder, $fileName, $disk);

        if (!$path) {
            throw new \RuntimeException(__('messages.file_upload_failed'));
        }

        return $path;
    }

    /**
     * Delete a file from storage.
     *
     * @param string|null $path
     * @param string $disk
     * @return bool
     */
    public static function delete(?string $path, string $disk = 'public'): bool
    {
        if ($path && Storage::disk($disk)->exists($path)) {
            return Storage::disk($disk)->delete($path);
        }
        return false;
    }

    /**
     * Get URL for a stored file.
     *
     * @param string|null $path
     * @param string $disk
     * @return string|null
     */
    public static function getUrl(?string $path, string $disk = 'public'): ?string
    {
        if (!$path) {
            return null;
        }
        return Storage::disk($disk)->url($path);
    }
}
