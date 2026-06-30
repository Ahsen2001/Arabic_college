<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PublicWebsiteController;
use App\Http\Controllers\Api\AdmissionsController;
use App\Http\Controllers\Api\AdminAdmissionsController;
use App\Http\Controllers\Api\AdminStudentController;
use App\Http\Controllers\Api\StudentDashboardController;

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

    // Admissions (Applicant Portal)
    Route::get('/admissions/draft', [AdmissionsController::class, 'draft']);
    Route::post('/admissions/save-draft', [AdmissionsController::class, 'saveDraft']);
    Route::post('/admissions/upload-document', [AdmissionsController::class, 'uploadDocument']);
    Route::post('/admissions/submit', [AdmissionsController::class, 'submit']);
    Route::post('/admissions/pay-fee', [AdmissionsController::class, 'payFee']);
    Route::get('/admissions/timeline', [AdmissionsController::class, 'timeline']);

    // Admin Admissions Review
    Route::get('/admin/applications', [AdminAdmissionsController::class, 'index']);
    Route::get('/admin/applications/{id}', [AdminAdmissionsController::class, 'show']);
    Route::post('/admin/applications/{id}/review', [AdminAdmissionsController::class, 'review']);
    Route::post('/admin/applications/{id}/schedule-interview', [AdminAdmissionsController::class, 'scheduleInterview']);
    Route::post('/admin/applications/{id}/select', [AdminAdmissionsController::class, 'select']);
    Route::post('/admin/applications/{id}/enroll', [AdminAdmissionsController::class, 'enroll']);
    Route::post('/admin/applications/bulk-email', [AdminAdmissionsController::class, 'bulkEmail']);

    // Student Information System (Admin & Registrar operations)
    Route::get('/admin/students', [AdminStudentController::class, 'index']);
    Route::get('/admin/students/export', [AdminStudentController::class, 'export']);
    Route::post('/admin/students/import', [AdminStudentController::class, 'import']);
    Route::get('/admin/students/{id}', [AdminStudentController::class, 'show']);
    Route::post('/admin/students/{id}/profile', [AdminStudentController::class, 'updateProfile']);
    Route::post('/admin/students/{id}/guardian', [AdminStudentController::class, 'updateGuardian']);
    Route::post('/admin/students/{id}/emergency', [AdminStudentController::class, 'updateEmergency']);
    Route::post('/admin/students/{id}/education', [AdminStudentController::class, 'updateEducation']);
    Route::post('/admin/students/{id}/medical', [AdminStudentController::class, 'updateMedical']);
    Route::post('/admin/students/{id}/scholarship', [AdminStudentController::class, 'updateScholarship']);

    // Student Portal Dashboard Operations
    Route::get('/student/dashboard', [StudentDashboardController::class, 'dashboard']);
    Route::get('/student/timeline', [StudentDashboardController::class, 'timeline']);
});
