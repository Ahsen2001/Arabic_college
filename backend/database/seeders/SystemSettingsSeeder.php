<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // College Information
            [
                'key' => 'college_name',
                'value' => 'Arabic Sharia College',
                'type' => 'string',
                'description' => 'Official name of the academic institution.'
            ],
            [
                'key' => 'college_abbreviation',
                'value' => 'ASC',
                'type' => 'string',
                'description' => 'Acronym or short abbreviation of the college.'
            ],
            [
                'key' => 'college_address',
                'value' => 'Academic Campus, Riyadh, Saudi Arabia',
                'type' => 'string',
                'description' => 'Physical headquarters street address of the college.'
            ],
            [
                'key' => 'college_phone',
                'value' => '+966 11 123 4567',
                'type' => 'string',
                'description' => 'Administrative office direct contact telephone lines.'
            ],
            [
                'key' => 'college_email',
                'value' => 'info@arabiccollege.edu',
                'type' => 'string',
                'description' => 'Primary administrative public support email address.'
            ],
            [
                'key' => 'college_logo',
                'value' => '/assets/logo.png',
                'type' => 'string',
                'description' => 'Path relative or direct url of the college brand logo.'
            ],

            // SMTP Settings
            [
                'key' => 'smtp_host',
                'value' => 'smtp.mailtrap.io',
                'type' => 'string',
                'description' => 'Mail server SMTP gateway host address.'
            ],
            [
                'key' => 'smtp_port',
                'value' => '2525',
                'type' => 'integer',
                'description' => 'Mail gateway connection port.'
            ],
            [
                'key' => 'smtp_username',
                'value' => 'mailtrap_sandbox_user',
                'type' => 'string',
                'description' => 'Authentication username key.'
            ],
            [
                'key' => 'smtp_password',
                'value' => 'mailtrap_sandbox_password',
                'type' => 'string',
                'description' => 'SMTP gateway pass key.'
            ],
            [
                'key' => 'smtp_encryption',
                'value' => 'tls',
                'type' => 'string',
                'description' => 'SSL or TLS connection parameter choice.'
            ],
            [
                'key' => 'smtp_from_name',
                'value' => 'Registrar Office ASC',
                'type' => 'string',
                'description' => 'Display name shown in mail sender headers.'
            ],
            [
                'key' => 'smtp_from_address',
                'value' => 'no-reply@arabiccollege.edu',
                'type' => 'string',
                'description' => 'Standard outgoing default system email address.'
            ],

            // System Configurations
            [
                'key' => 'default_language',
                'value' => 'ar',
                'type' => 'string',
                'description' => 'Default interface language code (ar/en).'
            ],
            [
                'key' => 'admission_status',
                'value' => 'open',
                'type' => 'string',
                'description' => 'Registrar admissions gate status (open/closed).'
            ],
            [
                'key' => 'default_theme',
                'value' => 'dark',
                'type' => 'string',
                'description' => 'Standard global default UI theme.'
            ],

            // OTP validation setup
            [
                'key' => 'otp_expiry_seconds',
                'value' => '300',
                'type' => 'integer',
                'description' => 'Duration in seconds for OTP expiration countdown.'
            ],
            [
                'key' => 'otp_digits',
                'value' => '6',
                'type' => 'integer',
                'description' => 'Number of digits in sent verification OTP codes.'
            ],
            [
                'key' => 'otp_mandatory',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Enforce OTP authentication check for new users.'
            ],

            // PDF templates settings
            [
                'key' => 'pdf_header_template',
                'value' => '<div style="text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;"><h2>ARABIC SHARIA COLLEGE</h2><p>Riyadh, Saudi Arabia | Official Certificate Record</p></div>',
                'type' => 'string',
                'description' => 'HTML header layout template used in generated documents.'
            ],
            [
                'key' => 'pdf_footer_template',
                'value' => '<div style="text-align: center; font-size: 10px; color: #64748b; margin-top: 20px;"><p>This document is digitally signed and QR verified. Verification Token: ASC-{TOKEN}</p></div>',
                'type' => 'string',
                'description' => 'HTML footer layout template used in generated documents.'
            ],
            [
                'key' => 'pdf_signature_path',
                'value' => '/assets/signature_registrar.png',
                'type' => 'string',
                'description' => 'Location path to official digital signature image.'
            ],

            // File Storage Parameters
            [
                'key' => 'file_storage_driver',
                'value' => 'local',
                'type' => 'string',
                'description' => 'Active upload disk system driver choice (local/s3).'
            ],
            [
                'key' => 'max_upload_size_mb',
                'value' => '10',
                'type' => 'integer',
                'description' => 'Maximum allowed file attachment upload size limit in MB.'
            ],

            // Security Rules
            [
                'key' => 'password_min_length',
                'value' => '8',
                'type' => 'integer',
                'description' => 'Required minimum characters count check for credentials passwords.'
            ],
            [
                'key' => 'password_require_symbols',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Mandatory inclusion of special character symbols inside passwords.'
            ],
            [
                'key' => 'login_max_attempts',
                'value' => '5',
                'type' => 'integer',
                'description' => 'Max failing credential entry tries allowed before throttle lock.'
            ],
            [
                'key' => 'session_lifetime_minutes',
                'value' => '120',
                'type' => 'integer',
                'description' => 'Duration in minutes of inactive users session files lifetime.'
            ],

            // Public Page CMS configurations (stored as JSON models)
            [
                'key' => 'cms_home_hero',
                'value' => json_encode([
                    [
                        'title' => 'Excellence in Islamic Sharia Jurisprudence',
                        'description' => 'Preserving classical legal traditions with rigorous scientific analysis and contemporary contexts.',
                        'image' => '/assets/hero_sharia.png',
                        'cta' => 'View Programs',
                        'link' => '/programs'
                    ],
                    [
                        'title' => 'Arabic Linguistics & Classical Literature',
                        'description' => 'Explore the depths of grammar, morphology, syntax, and rhetoric of classical Arabic.',
                        'image' => '/assets/hero_linguistics.png',
                        'cta' => 'Explore Faculty',
                        'link' => '/teachers'
                    ],
                    [
                        'title' => 'Hadith Sciences Research Center',
                        'description' => 'Academic cataloging and critiquing narration chains using advanced scientific methodology.',
                        'image' => '/assets/college_campus.png',
                        'cta' => 'Admissions Open',
                        'link' => '/admissions'
                    ]
                ]),
                'type' => 'json',
                'description' => 'Array database model of slides shown inside home slider section.'
            ],
            [
                'key' => 'cms_about_content',
                'value' => json_encode([
                    'intro_title' => 'Nurturing Academic Sharia Traditions & Arabic Linguistics',
                    'intro_desc' => 'Established to preserve the linguistic rigor and jurisprudence traditions of the Arab-Islamic world. We cultivate students who integrate profound scriptural mastery with critical contemporary perspectives.',
                    'values' => [
                        ['title' => 'Textual Integrity', 'desc' => 'Preserving Hadith narrations and classic grammar frameworks without compromises.'],
                        ['title' => 'Scientific Critique', 'desc' => 'Applying comparative logic, verification principles, and modern tools to legal analysis.'],
                        ['title' => 'Public Service', 'desc' => 'Graduating advisors, teachers, and jurists to lead global community values.']
                    ]
                ]),
                'type' => 'json',
                'description' => 'About page descriptive intro panels text and core values listings.'
            ],
            [
                'key' => 'cms_faq_list',
                'value' => json_encode([
                    [
                        'category' => 'admissions',
                        'question' => 'When do registrations for new applicants open?',
                        'answer' => 'Admissions registrations typically open in late June and close on July 31st. All documents including high school transcripts and ID copies must be uploaded during this period.'
                    ],
                    [
                        'category' => 'admissions',
                        'question' => 'How does the placement entrance exam work?',
                        'answer' => 'After submitting your online application, qualified applicants will sit for an Arabic language placement entrance exam in mid-August.'
                    ],
                    [
                        'category' => 'academics',
                        'question' => 'What language are classes taught in?',
                        'answer' => 'All major modules (Islamic Sharia law, Hadith chain critiques, Arabic literature) are taught entirely in classical Arabic.'
                    ],
                    [
                        'category' => 'academics',
                        'question' => 'Are the programs accredited?',
                        'answer' => 'Yes. All undergraduate degree programs (Bachelor of Sharia, Bachelor of Arabic Language, and Bachelor of Hadith Sciences) are fully accredited.'
                    ]
                ]),
                'type' => 'json',
                'description' => 'Accordions items listing published inside Frequently Asked Questions page.'
            ],
            [
                'key' => 'cms_gallery_images',
                'value' => json_encode([
                    ['image' => '/assets/hero_sharia.png', 'caption' => 'Jurisprudence Lecture Hall Entrance'],
                    ['image' => '/assets/hero_linguistics.png', 'caption' => 'Arabic Manuscripts Library Research Room'],
                    ['image' => '/assets/college_campus.png', 'caption' => 'Arabic Sharia College Central Academic Courtyard']
                ]),
                'type' => 'json',
                'description' => 'List array of image links and captions presented inside campus Gallery page.'
            ],
            [
                'key' => 'cms_news_bulletins',
                'value' => json_encode([
                    [
                        'id' => 1,
                        'title' => 'Fall Semester 2026 Admissions Open',
                        'content' => 'Applications are now being accepted for all degree tracks.',
                        'date' => '2026-06-25'
                    ],
                    [
                        'id' => 2,
                        'title' => 'Digital Library Services Active',
                        'content' => 'Search references, renew borrows, and access catalog assets online.',
                        'date' => '2026-06-28'
                    ]
                ]),
                'type' => 'json',
                'description' => 'School news announcements bulletins array.'
            ]
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                    'description' => $setting['description']
                ]
            );
        }
    }
}
