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
                    'name' => $program->translated_name,
                    'duration' => $program->duration_years . ' ' . __('messages.years'),
                    'credits' => $program->total_credits . ' ' . __('messages.credits'),
                    'department' => $program->department ? $program->department->translated_name : __('messages.general'),
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
                    1 => __('messages.professor'),
                    2 => __('messages.associate_professor'),
                    3 => __('messages.assistant_professor'),
                    4 => __('messages.lecturer'),
                    5 => __('messages.teaching_assistant'),
                ];
                $designation = $designations[$teacher->designation_id] ?? __('messages.faculty_member');

                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user ? $teacher->user->name : __('messages.anonymous_professor'),
                    'email' => $teacher->user ? $teacher->user->email : '',
                    'department' => $teacher->department ? $teacher->department->translated_name : __('messages.general'),
                    'specialization' => $teacher->specialization ?? __('messages.islamic_sciences'),
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
                'title' => __('messages.announcement_1_title'),
                'content' => __('messages.announcement_1_content'),
                'date' => '2026-06-25',
                'type' => 'announcement',
            ],
            [
                'id' => 2,
                'title' => __('messages.announcement_2_title'),
                'content' => __('messages.announcement_2_content'),
                'date' => '2026-06-28',
                'type' => 'announcement',
            ],
        ];

        $events = [
            [
                'id' => 1,
                'title' => __('messages.event_1_title'),
                'description' => __('messages.event_1_description'),
                'date' => '2026-07-10',
                'time' => '10:00 AM - 01:00 PM',
                'location' => __('messages.event_1_location'),
                'type' => 'event',
            ],
            [
                'id' => 2,
                'title' => __('messages.event_2_title'),
                'description' => __('messages.event_2_description'),
                'date' => '2026-07-20',
                'time' => '09:00 AM - 04:00 PM',
                'location' => __('messages.event_2_location'),
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
            ['title' => __('messages.download_1_title'), 'file_name' => 'college_prospectus_2026.pdf', 'file_size' => '4.2 MB'],
            ['title' => __('messages.download_2_title'), 'file_name' => 'syllabus_b_sharia.pdf', 'file_size' => '1.8 MB'],
            ['title' => __('messages.download_3_title'), 'file_name' => 'syllabus_b_arabic.pdf', 'file_size' => '1.5 MB'],
            ['title' => __('messages.download_4_title'), 'file_name' => 'syllabus_b_hadith.pdf', 'file_size' => '1.9 MB'],
            ['title' => __('messages.download_5_title'), 'file_name' => 'academic_calendar_2026.pdf', 'file_size' => '850 KB'],
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

    /**
     * Get CMS configuration content for public pages.
     *
     * @return JsonResponse
     */
    public function cms(): JsonResponse
    {
        $keys = [
            'college_name', 'college_abbreviation', 'college_address', 'college_phone', 'college_email', 'college_logo',
            'cms_home_hero', 'cms_about_content', 'cms_faq_list', 'cms_gallery_images', 'cms_news_bulletins', 'admission_status',
            'cms_footer_desc'
        ];

        $settings = \App\Models\Setting::whereIn('key', $keys)->get()->mapWithKeys(function ($setting) {
            $value = $setting->value;
            if ($setting->type === 'json' && $value) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $value = $decoded;
                }
            }

            // Translate CMS keys if they are defined in localization files
            if ($setting->key === 'college_name') {
                $value = __('messages.college_name');
            } elseif ($setting->key === 'college_address') {
                $value = __('messages.college_address');
            } elseif ($setting->key === 'college_abbreviation') {
                $value = __('messages.college_abbreviation');
            } elseif ($setting->key === 'cms_footer_desc') {
                $value = __('messages.cms_footer_desc');
            } elseif ($setting->key === 'cms_about_content') {
                $translated = __('messages.cms_about_content');
                if (is_array($translated)) {
                    $value = $translated;
                }
            } elseif ($setting->key === 'cms_home_hero' && is_array($value)) {
                // translate slide titles, descriptions and cta dynamically
                foreach ($value as $idx => &$slide) {
                    $titleKey = 'messages.hero_slides.' . $idx . '.title';
                    $descKey = 'messages.hero_slides.' . $idx . '.description';
                    $ctaKey = 'messages.hero_slides.' . $idx . '.cta';
                    if (\Illuminate\Support\Facades\Lang::has($titleKey)) {
                        $slide['title'] = __($titleKey);
                    }
                    if (\Illuminate\Support\Facades\Lang::has($descKey)) {
                        $slide['description'] = __($descKey);
                    }
                    if (\Illuminate\Support\Facades\Lang::has($ctaKey)) {
                        $slide['cta'] = __($ctaKey);
                    }
                }
            } elseif ($setting->key === 'cms_faq_list' && is_array($value)) {
                // translate faq categories, questions, and answers dynamically
                foreach ($value as $idx => &$faq) {
                    $qKey = 'messages.faq.' . $idx . '.question';
                    $aKey = 'messages.faq.' . $idx . '.answer';
                    if (\Illuminate\Support\Facades\Lang::has($qKey)) {
                        $faq['question'] = __($qKey);
                    }
                    if (\Illuminate\Support\Facades\Lang::has($aKey)) {
                        $faq['answer'] = __($aKey);
                    }
                }
            }

            return [$setting->key => $value];
        });

        return ApiResponse::success($settings, 'CMS settings fetched successfully.');
    }
}
