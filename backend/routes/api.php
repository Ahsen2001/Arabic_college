<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PublicWebsiteController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Public Website API routes
Route::prefix('public')->group(function () {
    Route::get('/programs', [PublicWebsiteController::class, 'programs']);
    Route::get('/teachers', [PublicWebsiteController::class, 'teachers']);
    Route::get('/news-events', [PublicWebsiteController::class, 'newsEvents']);
    Route::get('/downloads', [PublicWebsiteController::class, 'downloads']);
    Route::post('/contact', [PublicWebsiteController::class, 'contact']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    
    // User Management resource routes
    Route::apiResource('users', UserController::class);
});
