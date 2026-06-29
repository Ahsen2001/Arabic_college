<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ApiResponse
{
    /**
     * Return a success JSON response.
     *
     * @param mixed $data
     * @param string|null $message
     * @param int $code
     * @return JsonResponse
     */
    public static function success(mixed $data = null, ?string $message = null, int $code = Response::HTTP_OK): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => $message ?? __('messages.operation_success'),
            'data' => $data,
            'errors' => null,
        ], $code);
    }

    /**
     * Return an error JSON response.
     *
     * @param string $message
     * @param int $code
     * @param mixed|null $errors
     * @return JsonResponse
     */
    public static function error(string $message, int $code = Response::HTTP_BAD_REQUEST, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $code);
    }

    /**
     * Return a validation error JSON response.
     *
     * @param mixed $errors
     * @param string|null $message
     * @return JsonResponse
     */
    public static function validationError(mixed $errors, ?string $message = null): JsonResponse
    {
        return self::error(
            $message ?? __('messages.validation_error'),
            Response::HTTP_UNPROCESSABLE_ENTITY,
            $errors
        );
    }

    /**
     * Return an unauthorized JSON response.
     *
     * @param string|null $message
     * @return JsonResponse
     */
    public static function unauthorized(?string $message = null): JsonResponse
    {
        return self::error(
            $message ?? __('messages.unauthorized'),
            Response::HTTP_UNAUTHORIZED
        );
    }

    /**
     * Return a forbidden JSON response.
     *
     * @param string|null $message
     * @return JsonResponse
     */
    public static function forbidden(?string $message = null): JsonResponse
    {
        return self::error(
            $message ?? __('messages.forbidden'),
            Response::HTTP_FORBIDDEN
        );
    }

    /**
     * Return a not found JSON response.
     *
     * @param string|null $message
     * @return JsonResponse
     */
    public static function notFound(?string $message = null): JsonResponse
    {
        return self::error(
            $message ?? __('messages.not_found'),
            Response::HTTP_NOT_FOUND
        );
    }
}
