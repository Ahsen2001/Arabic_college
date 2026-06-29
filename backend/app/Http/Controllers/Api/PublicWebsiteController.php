<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicWebsiteController extends Controller
{
    /**
     * Get active academic programs list.
     *
     * @return JsonResponse
     */
    public function programs(): JsonResponse
    {
        $programs = Program::with('department')
            ->select('id', 'department_id', 'name_ar', 'name_en', 'code', 'duration_years', 'total_credits')
            ->get()
            ->map(function ($program) {
                return [
                    'id' => $program->id,
                    'code' => $program->code,
                    'name_ar' => $program->name_ar,
                    'name_en' => $program->name_en,
                    'duration' => $program->duration_years . ' Years',
                    'credits' => $program->total_credits . ' Credits',
                    'department' => $program->department ? $program->department->name_en : 'General',
                ];
            });

        return ApiResponse::success($programs, 'Programs fetched successfully.');
    }

    /**
     * Get active faculty list.
     *
     * @return JsonResponse
     */
    public function teachers(): JsonResponse
    {
        $teachers = Teacher::with(['user', 'department'])
            ->where('status_id', 1) // Active teachers
            ->get()
            ->map(function ($teacher) {
                // Determine designation text
                $designations = [
                    1 => 'Professor',
                    2 => 'Associate Professor',
                    3 => 'Assistant Professor',
                    4 => 'Lecturer',
                    5 => 'Teaching Assistant',
                ];
                $designation = $designations[$teacher->designation_id] ?? 'Faculty Member';

                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user ? $teacher->user->name : 'Anonymous Professor',
                    'email' => $teacher->user ? $teacher->user->email : '',
                    'department' => $teacher->department ? $teacher->department->name_en : 'General',
                    'specialization' => $teacher->specialization ?? 'Islamic Sciences',
                    'designation' => $designation,
                ];
            });

        return ApiResponse::success($teachers, 'Teachers fetched successfully.');
    }

    /**
     * Get college news, announcements, and events.
     *
     * @return JsonResponse
     */
    public function newsEvents(): JsonResponse
    {
        $announcements = [
            [
                'id' => 1,
                'title' => 'Fall Semester 2026 Registrations Open',
                'content' => 'Applications are now being accepted for B-Sharia, B-Arabic, and B-Hadith programs for the academic year 2026/2027. Apply online through our admissions portal.',
                'date' => '2026-06-25',
                'type' => 'announcement',
            ],
            [
                'id' => 2,
                'title' => 'Digital Library Catalog Launch',
                'content' => 'We are pleased to introduce our digital catalog system. Students can now search books, renew loans, and inspect reference availability online.',
                'date' => '2026-06-28',
                'type' => 'announcement',
            ],
        ];

        $events = [
            [
                'id' => 1,
                'title' => 'Arabic Calligraphy Masterclass',
                'description' => 'A workshop covering Thuluth and Naskh scripts, hosted by Sheikh Dr. Bilal Al-Madani.',
                'date' => '2026-07-10',
                'time' => '10:00 AM - 01:00 PM',
                'location' => 'Main Academic Hall B',
                'type' => 'event',
            ],
            [
                'id' => 2,
                'title' => 'Symposium on Hadith Methodology',
                'description' => 'A classical research paper discussion regarding narrator critic analysis in modern database compilation.',
                'date' => '2026-07-20',
                'time' => '09:00 AM - 04:00 PM',
                'location' => 'Library Conference Hall',
                'type' => 'event',
            ],
        ];

        return ApiResponse::success([
            'announcements' => $announcements,
            'events' => $events,
        ], 'News and events fetched successfully.');
    }

    /**
     * Get public document downloads links.
     *
     * @return JsonResponse
     */
    public function downloads(): JsonResponse
    {
        $downloads = [
            ['title' => 'College Prospectus 2026-2027', 'file_name' => 'college_prospectus_2026.pdf', 'file_size' => '4.2 MB'],
            ['title' => 'Syllabus: Bachelor of Sharia (Islamic Fiqh)', 'file_name' => 'syllabus_b_sharia.pdf', 'file_size' => '1.8 MB'],
            ['title' => 'Syllabus: Bachelor of Arabic Language', 'file_name' => 'syllabus_b_arabic.pdf', 'file_size' => '1.5 MB'],
            ['title' => 'Syllabus: Bachelor of Hadith Sciences', 'file_name' => 'syllabus_b_hadith.pdf', 'file_size' => '1.9 MB'],
            ['title' => 'Academic Calendar 2026/2027', 'file_name' => 'academic_calendar_2026.pdf', 'file_size' => '850 KB'],
        ];

        return ApiResponse::success($downloads, 'Downloads listed successfully.');
    }

    /**
     * Submit contact query.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function contact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:10'],
        ]);

        // Log the message securely to laravel.log
        Log::info("Public Contact Submission:", $validated);

        return ApiResponse::success(null, 'Your query has been submitted successfully. Our registrar team will reach out shortly.');
    }
}
