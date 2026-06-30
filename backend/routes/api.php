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

use App\Http\Controllers\Api\AdminTeacherController;
use App\Http\Controllers\Api\AdminStaffController;
use App\Http\Controllers\Api\AdminAcademicStructureController;
use App\Http\Controllers\Api\ShareeaAcademicController;
use App\Http\Controllers\Api\HifzMemorizationController;
use App\Http\Controllers\Api\AttendanceManagementController;

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

    // Teacher & Staff Management
    Route::get('/admin/teachers', [AdminTeacherController::class, 'index']);
    Route::post('/admin/teachers', [AdminTeacherController::class, 'store']);
    Route::get('/admin/teachers/{id}', [AdminTeacherController::class, 'show']);
    Route::post('/admin/teachers/{id}/update', [AdminTeacherController::class, 'update']);
    Route::post('/admin/teachers/{id}/qualifications', [AdminTeacherController::class, 'updateQualifications']);
    Route::post('/admin/teachers/{id}/experience', [AdminTeacherController::class, 'updateExperience']);
    Route::post('/admin/teachers/{id}/timetable', [AdminTeacherController::class, 'allocateTimetable']);
    Route::get('/admin/teachers/{id}/leaves', [AdminTeacherController::class, 'leaveIndex']);
    Route::post('/admin/teachers/{id}/leaves', [AdminTeacherController::class, 'leaveStore']);
    Route::post('/admin/leaves/{leaveId}/action', [AdminTeacherController::class, 'leaveAction']);

    Route::get('/admin/staff', [AdminStaffController::class, 'index']);
    Route::post('/admin/staff', [AdminStaffController::class, 'store']);
    Route::get('/admin/staff/{id}', [AdminStaffController::class, 'show']);
    Route::post('/admin/staff/{id}/update', [AdminStaffController::class, 'update']);
    Route::post('/admin/staff/{id}/qualifications', [AdminStaffController::class, 'updateQualifications']);
    Route::post('/admin/staff/{id}/experience', [AdminStaffController::class, 'updateExperience']);
    Route::get('/admin/staff/{id}/leaves', [AdminStaffController::class, 'leaveIndex']);
    Route::post('/admin/staff/{id}/leaves', [AdminStaffController::class, 'leaveStore']);

    // Academic Structure Management
    Route::get('/admin/academic/departments', [AdminAcademicStructureController::class, 'getDepartments']);
    Route::post('/admin/academic/departments', [AdminAcademicStructureController::class, 'storeDepartment']);
    Route::post('/admin/academic/departments/{id}/update', [AdminAcademicStructureController::class, 'updateDepartment']);

    Route::get('/admin/academic/programs', [AdminAcademicStructureController::class, 'getPrograms']);
    Route::post('/admin/academic/programs', [AdminAcademicStructureController::class, 'storeProgram']);
    Route::post('/admin/academic/programs/{id}/update', [AdminAcademicStructureController::class, 'updateProgram']);

    Route::get('/admin/academic/years', [AdminAcademicStructureController::class, 'getAcademicYears']);
    Route::post('/admin/academic/years', [AdminAcademicStructureController::class, 'storeAcademicYear']);
    Route::post('/admin/academic/years/{id}/update', [AdminAcademicStructureController::class, 'updateAcademicYear']);

    Route::get('/admin/academic/semesters', [AdminAcademicStructureController::class, 'getSemesters']);
    Route::post('/admin/academic/semesters', [AdminAcademicStructureController::class, 'storeSemester']);
    Route::post('/admin/academic/semesters/{id}/update', [AdminAcademicStructureController::class, 'updateSemester']);

    Route::get('/admin/academic/subjects', [AdminAcademicStructureController::class, 'getSubjects']);
    Route::post('/admin/academic/subjects', [AdminAcademicStructureController::class, 'storeSubject']);
    Route::post('/admin/academic/subjects/{id}/update', [AdminAcademicStructureController::class, 'updateSubject']);

    Route::get('/admin/academic/programs/{id}/curriculum', [AdminAcademicStructureController::class, 'getCurriculum']);
    Route::post('/admin/academic/programs/{id}/curriculum', [AdminAcademicStructureController::class, 'syncCurriculum']);

    Route::get('/admin/academic/courses', [AdminAcademicStructureController::class, 'getCourses']);
    Route::post('/admin/academic/courses', [AdminAcademicStructureController::class, 'storeCourse']);
    Route::post('/admin/academic/courses/{id}/update', [AdminAcademicStructureController::class, 'updateCourse']);

    // Shareea Academic Module
    Route::get('/shareea/courses/{courseId}/attendance', [ShareeaAcademicController::class, 'getAttendance']);
    Route::post('/shareea/courses/{courseId}/attendance', [ShareeaAcademicController::class, 'markAttendance']);

    Route::get('/shareea/courses/{courseId}/assignments', [ShareeaAcademicController::class, 'getAssignments']);
    Route::post('/shareea/courses/{courseId}/assignments', [ShareeaAcademicController::class, 'storeAssignment']);
    Route::get('/shareea/assignments/{assignmentId}/submissions', [ShareeaAcademicController::class, 'getSubmissions']);
    Route::post('/shareea/assignments/{assignmentId}/grade', [ShareeaAcademicController::class, 'gradeSubmission']);

    Route::get('/shareea/courses/{courseId}/gradebook', [ShareeaAcademicController::class, 'getGradebook']);
    Route::post('/shareea/courses/{courseId}/gradebook', [ShareeaAcademicController::class, 'saveGradebook']);

    Route::get('/shareea/students/{studentId}/transcript', [ShareeaAcademicController::class, 'getTranscript']);
    Route::post('/shareea/students/{studentId}/promote', [ShareeaAcademicController::class, 'promoteStudent']);
    Route::post('/shareea/students/{studentId}/graduate', [ShareeaAcademicController::class, 'graduateStudent']);

    Route::get('/shareea/analytics', [ShareeaAcademicController::class, 'getAnalytics']);

    // Hifz Memorization Module
    Route::post('/hifz/logs', [HifzMemorizationController::class, 'logDaily']);
    Route::post('/hifz/assessments', [HifzMemorizationController::class, 'logAssessment']);
    Route::post('/hifz/milestones', [HifzMemorizationController::class, 'logMilestone']);
    Route::get('/hifz/student/{studentId}/progress', [HifzMemorizationController::class, 'getProgress']);
    Route::get('/hifz/reports', [HifzMemorizationController::class, 'getReports']);

    // Attendance Management
    Route::get('/attendance/students', [AttendanceManagementController::class, 'getStudentAttendance']);
    Route::post('/attendance/students/bulk', [AttendanceManagementController::class, 'saveStudentAttendanceBulk']);
    Route::post('/attendance/students/qr', [AttendanceManagementController::class, 'markQRStudentAttendance']);

    Route::get('/attendance/staff', [AttendanceManagementController::class, 'getStaffAttendance']);
    Route::post('/attendance/staff/bulk', [AttendanceManagementController::class, 'saveStaffAttendanceBulk']);
    Route::post('/attendance/staff/qr', [AttendanceManagementController::class, 'markQRStaffAttendance']);

    Route::get('/attendance/leaves', [AttendanceManagementController::class, 'getLeaveRequests']);
    Route::post('/attendance/leaves', [AttendanceManagementController::class, 'storeLeaveRequest']);
    Route::post('/attendance/leaves/{leaveId}/action', [AttendanceManagementController::class, 'approveLeaveRequest']);

    Route::get('/attendance/analytics', [AttendanceManagementController::class, 'getAttendanceAnalytics']);
});
