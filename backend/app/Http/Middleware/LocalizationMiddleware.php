<?php

namespace App\Http\Middleware;

use App\Constants\AppConstants;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LocalizationMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header(AppConstants::LOCALE_HEADER) ?? AppConstants::DEFAULT_LOCALE;

        if (in_array($locale, AppConstants::SUPPORTED_LOCALES, true)) {
            app()->setLocale($locale);
        } else {
            app()->setLocale(AppConstants::DEFAULT_LOCALE);
        }

        $response = $next($request);

        // Add Content-Language header to response
        $response->headers->set('Content-Language', app()->getLocale());

        return $response;
    }
}
