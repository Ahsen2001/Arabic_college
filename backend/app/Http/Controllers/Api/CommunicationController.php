<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\AcademicCalendarEvent;
use App\Models\Announcement;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\Student;
use App\Models\User;
use App\Services\Sms\SmsManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CommunicationController extends Controller
{
    /* ==========================================================================
       ANNOUNCEMENTS API
       ========================================================================== */

    /**
     * List active announcements.
     */
    public function indexAnnouncements(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Announcement::with('creator');

        // Non-admins only see target audience announcements
        if ($user && !$user->hasRole('Super Admin')) {
            $audience = ['All'];
            if ($user->hasRole('Student')) {
                $audience[] = 'Student';
            } elseif ($user->hasRole('Teacher')) {
                $audience[] = 'Teacher';
            } elseif ($user->hasRole('Staff')) {
                $audience[] = 'Staff';
            }

            $query->whereIn('audience_type', $audience)
                  ->where('published_at', '<=', now())
                  ->where(function ($q) {
                      $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                  });
        }

        $announcements = $query->orderBy('published_at', 'desc')->get()->map(function ($ann) {
            return [
                'id' => $ann->id,
                'title' => $ann->title,
                'content' => $ann->content,
                'audience_type' => $ann->audience_type,
                'published_at' => $ann->published_at ? $ann->published_at->format('Y-m-d H:i') : null,
                'expires_at' => $ann->expires_at ? $ann->expires_at->format('Y-m-d H:i') : null,
                'creator_name' => $ann->creator ? $ann->creator->name : 'System',
            ];
        });

        return ApiResponse::success($announcements, 'Announcements retrieved.');
    }

    /**
     * Create a new announcement (Admin only).
     */
    public function storeAnnouncement(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'audience_type' => ['required', 'string', 'in:All,Student,Teacher,Staff'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $ann = Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'audience_type' => $request->audience_type,
            'created_by_user_id' => Auth::id(),
            'published_at' => now(),
            'expires_at' => $request->expires_at,
        ]);

        return ApiResponse::success($ann, 'Announcement published successfully.');
    }

    /**
     * Delete an announcement.
     */
    public function destroyAnnouncement($id): JsonResponse
    {
        $ann = Announcement::find($id);
        if (!$ann) {
            return ApiResponse::error('Announcement not found.', 404);
        }

        $ann->delete();
        return ApiResponse::success(null, 'Announcement removed.');
    }

    /* ==========================================================================
       EMAIL TEMPLATES API
       ========================================================================== */

    public function indexTemplates(): JsonResponse
    {
        return ApiResponse::success(EmailTemplate::orderBy('name', 'asc')->get(), 'Email templates retrieved.');
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:email_templates,name,' . $request->id],
            'subject' => ['required', 'string', 'max:255'],
            'body_markup' => ['required', 'string'],
        ]);

        $template = EmailTemplate::updateOrCreate(
            ['id' => $request->id],
            $request->only(['name', 'subject', 'body_markup'])
        );

        return ApiResponse::success($template, 'Email template saved.');
    }

    /* ==========================================================================
       EMAIL QUEUE / LOGS API
       ========================================================================== */

    public function indexEmailLogs(): JsonResponse
    {
        $logs = EmailLog::with('triggerUser')->orderBy('created_at', 'desc')->get()->map(function ($log) {
            return [
                'id' => $log->id,
                'recipient_email' => $log->recipient_email,
                'subject' => $log->subject,
                'body' => $log->body,
                'status' => $log->status,
                'error_message' => $log->error_message,
                'sent_at' => $log->sent_at ? $log->sent_at->format('Y-m-d H:i') : null,
                'created_at' => $log->created_at ? $log->created_at->format('Y-m-d H:i') : null,
                'trigger_by' => $log->triggerUser ? $log->triggerUser->name : 'System',
            ];
        });

        return ApiResponse::success($logs, 'Email logs and queues retrieved.');
    }

    /**
     * Dispatch bulk emails based on custom recipient filters.
     */
    public function sendBulkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'recipient_role' => ['required', 'string', 'in:All,Student,Teacher,Staff'],
            'program_id' => ['nullable', 'integer'],
            'status_id' => ['nullable', 'integer'],
            'template_id' => ['required', 'integer', 'exists:email_templates,id'],
        ]);

        $template = EmailTemplate::find($request->template_id);
        if (!$template) {
            return ApiResponse::error('Template not found.', 404);
        }

        // Fetch targets based on role and filters
        $recipientsQuery = User::query();

        if ($request->recipient_role === 'Student') {
            $recipientsQuery->role('Student');
            
            // Check student-specific filters
            if ($request->program_id || $request->status_id) {
                $recipientsQuery->whereHas('studentProfile', function ($sq) use ($request) {
                    if ($request->program_id) {
                        $sq->where('program_id', $request->program_id);
                    }
                    if ($request->status_id) {
                        $sq->where('status_id', $request->status_id);
                    }
                });
            }
        } elseif ($request->recipient_role === 'Teacher') {
            $recipientsQuery->role('Teacher');
        } elseif ($request->recipient_role === 'Staff') {
            $recipientsQuery->role('Staff');
        } else {
            // All
            $recipientsQuery->whereHas('roles');
        }

        $users = $recipientsQuery->get();

        if ($users->isEmpty()) {
            return ApiResponse::error('No recipients found matching the chosen criteria.', 404);
        }

        $queuedCount = 0;

        foreach ($users as $user) {
            // Compile template
            $subject = $template->subject;
            $body = $template->body_markup;

            // Placeholders compilation
            $placeholders = [
                '{{NAME}}' => $user->name,
                '{{EMAIL}}' => $user->email,
                '{{PHONE}}' => $user->phone ?? 'N/A',
                '{{DATE}}' => date('Y-m-d'),
            ];

            $body = str_replace(array_keys($placeholders), array_values($placeholders), $body);
            $subject = str_replace(array_keys($placeholders), array_values($placeholders), $subject);

            // Queue the email
            EmailLog::create([
                'recipient_email' => $user->email,
                'subject' => $subject,
                'body' => $body,
                'status' => 'Pending',
                'triggered_by_user_id' => Auth::id(),
            ]);

            $queuedCount++;
        }

        return ApiResponse::success(null, "Bulk dispatch compiled. Queued {$queuedCount} emails successfully.");
    }

    /**
     * Manually process the email dispatch queue.
     */
    public function processQueue(): JsonResponse
    {
        $pendingLogs = EmailLog::where('status', 'Pending')->get();

        if ($pendingLogs->isEmpty()) {
            return ApiResponse::success(null, 'No pending emails in the queue.');
        }

        $sent = 0;
        $failed = 0;

        foreach ($pendingLogs as $log) {
            try {
                // Mock sending email to log files
                Log::info("EMAIL DISPATCHED: To: {$log->recipient_email} | Subject: {$log->subject}");
                
                $log->update([
                    'status' => 'Sent',
                    'sent_at' => now(),
                ]);
                $sent++;
            } catch (\Exception $e) {
                $log->update([
                    'status' => 'Failed',
                    'error_message' => $e->getMessage(),
                ]);
                $failed++;
            }
        }

        return ApiResponse::success(null, "Queue processed. Sent: {$sent}, Failed: {$failed}.");
    }

    /* ==========================================================================
       ACADEMIC CALENDAR API
       ========================================================================== */

    public function indexCalendar(): JsonResponse
    {
        $events = AcademicCalendarEvent::orderBy('start_date', 'asc')->get()->map(function ($ev) {
            return [
                'id' => $ev->id,
                'title' => $ev->title,
                'description' => $ev->description,
                'event_type' => $ev->event_type,
                'start_date' => $ev->start_date->format('Y-m-d'),
                'end_date' => $ev->end_date->format('Y-m-d'),
                'is_holiday' => $ev->is_holiday,
            ];
        });

        return ApiResponse::success($events, 'Academic calendar events retrieved.');
    }

    public function storeCalendar(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_type' => ['required', 'string', 'in:Holiday,Exam Period,Registration,Event'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'is_holiday' => ['required', 'boolean'],
        ]);

        $event = AcademicCalendarEvent::create($request->all());
        return ApiResponse::success($event, 'Calendar event added successfully.');
    }

    public function destroyCalendar($id): JsonResponse
    {
        $event = AcademicCalendarEvent::find($id);
        if (!$event) {
            return ApiResponse::error('Event not found.', 404);
        }

        $event->delete();
        return ApiResponse::success(null, 'Calendar event deleted.');
    }

    /* ==========================================================================
       SMS TEST GATEWAY API
       ========================================================================== */

    public function testSmsGateway(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'message' => ['required', 'string', 'max:160'],
        ]);

        try {
            $smsDriver = SmsManager::resolveDriver();
            $success = $smsDriver->send($request->phone, $request->message);

            if ($success) {
                return ApiResponse::success(null, 'Test SMS sent successfully via active driver.');
            }
            return ApiResponse::error('SMS driver failed to send message.');
        } catch (\Exception $e) {
            return ApiResponse::error('SMS Gateway Error: ' . $e->getMessage());
        }
    }
}
