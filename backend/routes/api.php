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
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\GlobalSearchController;

use App\Http\Controllers\Api\AdminTeacherController;
use App\Http\Controllers\Api\AdminStaffController;
use App\Http\Controllers\Api\AdminAcademicStructureController;
use App\Http\Controllers\Api\ShareeaAcademicController;
use App\Http\Controllers\Api\HifzMemorizationController;
use App\Http\Controllers\Api\AttendanceManagementController;
use App\Http\Controllers\Api\ExaminationManagementController;
use App\Http\Controllers\Api\TimetableManagementController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\LibraryManagementController;
use App\Http\Controllers\Api\ResearchManagementController;
use App\Http\Controllers\Api\DocumentManagementController;
use App\Http\Controllers\Api\CommunicationController;
use App\Http\Controllers\Api\SystemSettingsController;



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
    Route::get('/cms', [PublicWebsiteController::class, 'cms']);
});

Route::get('/verify-document/{token}', [DocumentManagementController::class, 'verifyDocument']);


// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/search/global', [GlobalSearchController::class, 'search']);
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

    // Examination Management
    Route::get('/exams/schedules', [ExaminationManagementController::class, 'getSchedules']);
    Route::post('/exams/schedules', [ExaminationManagementController::class, 'storeSchedule']);
    Route::get('/exams/{examId}/marks', [ExaminationManagementController::class, 'getMarks']);
    Route::post('/exams/{examId}/marks', [ExaminationManagementController::class, 'saveMarks']);
    Route::post('/exams/{examId}/publish', [ExaminationManagementController::class, 'publishResults']);
    Route::get('/exams/ranks', [ExaminationManagementController::class, 'getRankings']);
    Route::get('/exams/recheck', [ExaminationManagementController::class, 'getRecheckRequests']);
    Route::post('/exams/results/{resultId}/recheck', [ExaminationManagementController::class, 'fileRecheckRequest']);
    Route::post('/exams/recheck/{recheckId}/action', [ExaminationManagementController::class, 'actionRecheckRequest']);
    Route::get('/exams/analytics', [ExaminationManagementController::class, 'getAnalytics']);

    // Timetable Management
    Route::get('/timetable/rooms', [TimetableManagementController::class, 'getRooms']);
    Route::post('/timetable/rooms', [TimetableManagementController::class, 'storeRoom']);
    Route::post('/timetable/rooms/{roomId}/update', [TimetableManagementController::class, 'updateRoom']);
    Route::get('/timetable/slots', [TimetableManagementController::class, 'getSlots']);
    Route::post('/timetable/slots', [TimetableManagementController::class, 'storeSlot']);
    Route::post('/timetable/slots/{slotId}/update', [TimetableManagementController::class, 'updateSlot']);
    Route::delete('/timetable/slots/{slotId}', [TimetableManagementController::class, 'deleteSlot']);
    Route::get('/timetable/analytics', [TimetableManagementController::class, 'getAnalytics']);

    // Finance Module
    Route::get('/finance/lookups', [FinanceController::class, 'getLookups']);
    Route::get('/finance/fee-types', [FinanceController::class, 'getFeeTypes']);
    Route::post('/finance/fee-types', [FinanceController::class, 'storeFeeType']);
    Route::post('/finance/fee-types/{id}/update', [FinanceController::class, 'updateFeeType']);

    Route::get('/finance/invoices', [FinanceController::class, 'getInvoices']);
    Route::get('/finance/invoices/{id}', [FinanceController::class, 'getInvoice']);
    Route::post('/finance/invoices', [FinanceController::class, 'createInvoice']);
    Route::post('/finance/invoices/{id}/issue', [FinanceController::class, 'issueInvoice']);
    Route::post('/finance/invoices/{id}/discount', [FinanceController::class, 'applyDiscount']);

    Route::post('/finance/payments', [FinanceController::class, 'recordPayment']);
    Route::get('/finance/transactions', [FinanceController::class, 'getTransactions']);

    Route::post('/finance/installments', [FinanceController::class, 'createInstallmentPlan']);
    Route::post('/finance/installments/{id}/pay', [FinanceController::class, 'payInstallment']);

    Route::get('/finance/scholarships', [FinanceController::class, 'getScholarships']);
    Route::post('/finance/scholarships', [FinanceController::class, 'storeScholarship']);
    Route::post('/finance/scholarships/award', [FinanceController::class, 'awardScholarship']);
    Route::get('/finance/scholarships/student/{studentId}', [FinanceController::class, 'getStudentScholarships']);

    Route::get('/finance/discounts', [FinanceController::class, 'getDiscounts']);
    Route::post('/finance/discounts', [FinanceController::class, 'storeDiscount']);

    Route::get('/finance/outstanding', [FinanceController::class, 'getOutstanding']);
    Route::get('/finance/analytics', [FinanceController::class, 'getAnalytics']);

    // Library Management
    Route::get('/library/lookups', [LibraryManagementController::class, 'getLookups']);
    Route::get('/library/books', [LibraryManagementController::class, 'getBooks']);
    Route::post('/library/books', [LibraryManagementController::class, 'storeBook']);
    Route::post('/library/books/{id}/update', [LibraryManagementController::class, 'updateBook']);
    Route::delete('/library/books/{id}', [LibraryManagementController::class, 'deleteBook']);
    Route::post('/library/borrow', [LibraryManagementController::class, 'borrowBook']);
    Route::post('/library/return', [LibraryManagementController::class, 'returnBook']);
    Route::get('/library/borrows', [LibraryManagementController::class, 'getActiveBorrows']);
    Route::post('/library/categories', [LibraryManagementController::class, 'storeCategory']);
    Route::get('/library/analytics', [LibraryManagementController::class, 'getAnalytics']);

    // Research Paper Management
    Route::get('/research/supervisors', [ResearchManagementController::class, 'getSupervisors']);
    Route::get('/research/categories', [ResearchManagementController::class, 'getCategories']);
    Route::get('/research/papers', [ResearchManagementController::class, 'getPapers']);
    Route::get('/research/papers/{id}', [ResearchManagementController::class, 'getPaper']);
    Route::post('/research/papers', [ResearchManagementController::class, 'storePaper']);
    Route::post('/research/papers/{id}/version', [ResearchManagementController::class, 'uploadNewVersion']);
    Route::post('/research/papers/{id}/submit', [ResearchManagementController::class, 'submitPaper']);
    Route::post('/research/papers/{id}/workflow', [ResearchManagementController::class, 'processWorkflow']);
    Route::get('/research/versions/{versionId}/preview', [ResearchManagementController::class, 'previewVersion']);
    Route::get('/research/versions/{versionId}/download', [ResearchManagementController::class, 'downloadVersion']);

    // Document Management
    Route::get('/document/templates', [DocumentManagementController::class, 'getTemplates']);
    Route::post('/document/templates', [DocumentManagementController::class, 'storeTemplate']);
    Route::post('/document/templates/{id}/update', [DocumentManagementController::class, 'updateTemplate']);
    Route::delete('/document/templates/{id}', [DocumentManagementController::class, 'deleteTemplate']);
    Route::post('/document/generate', [DocumentManagementController::class, 'generateDocument']);
    Route::post('/document/download-pdf', [DocumentManagementController::class, 'downloadPdf']);

    // Communication Center
    Route::get('/communication/announcements', [CommunicationController::class, 'indexAnnouncements']);
    Route::post('/communication/announcements', [CommunicationController::class, 'storeAnnouncement']);
    Route::delete('/communication/announcements/{id}', [CommunicationController::class, 'destroyAnnouncement']);

    Route::get('/communication/email-templates', [CommunicationController::class, 'indexTemplates']);
    Route::post('/communication/email-templates', [CommunicationController::class, 'storeTemplate']);

    Route::get('/communication/email-logs', [CommunicationController::class, 'indexEmailLogs']);
    Route::post('/communication/emails/send-bulk', [CommunicationController::class, 'sendBulkEmail']);
    Route::post('/communication/emails/process-queue', [CommunicationController::class, 'processQueue']);

    Route::get('/communication/calendar', [CommunicationController::class, 'indexCalendar']);
    Route::post('/communication/calendar', [CommunicationController::class, 'storeCalendar']);
    Route::delete('/communication/calendar/{id}', [CommunicationController::class, 'destroyCalendar']);

    Route::post('/communication/sms/test', [CommunicationController::class, 'testSmsGateway']);

    // System Settings & CMS Operations
    Route::get('/admin/settings', [SystemSettingsController::class, 'index']);
    Route::post('/admin/settings', [SystemSettingsController::class, 'update']);
    Route::post('/admin/settings/logo', [SystemSettingsController::class, 'uploadLogo']);
    Route::post('/admin/settings/backup', [SystemSettingsController::class, 'triggerBackup']);
    Route::get('/admin/settings/backup/{id}/download', [SystemSettingsController::class, 'downloadBackup']);
    Route::post('/admin/settings/backup/{id}/restore', [SystemSettingsController::class, 'restoreBackup']);

    // Audit Logs
    Route::get('/admin/audit-logs', [AuditLogController::class, 'index']);
});



