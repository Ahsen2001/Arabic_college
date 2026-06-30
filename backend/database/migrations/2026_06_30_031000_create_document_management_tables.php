<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Document Templates
        if (!Schema::hasTable('document_templates')) {
            Schema::create('document_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // e.g. "Certificate of Graduation"
                $table->enum('type', ['OfferLetter', 'Certificate', 'IDCard', 'Transcript', 'CharacterCertificate', 'Custom'])->default('Custom');
                $table->text('html_content');
                $table->text('css_content')->nullable();
                $table->boolean('qr_enabled')->default(true);
                $table->boolean('signature_enabled')->default(true);
                $table->string('signature_title')->default('Registrar');
                $table->timestamps();
            });
        }

        // 2. Generated Documents Ledger
        if (!Schema::hasTable('generated_documents')) {
            Schema::create('generated_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
                $table->foreignId('document_template_id')->constrained('document_templates')->onDelete('cascade');
                $table->string('document_number')->unique(); // for QR verification lookup
                $table->string('verification_token')->unique();
                $table->string('file_path')->nullable(); // secure vault PDF path
                $table->timestamps();

                $table->index('student_id');
                $table->index('document_template_id');
                $table->index('document_number');
            });
        }

        // Seed some basic templates
        $now = now();

        // Offer Letter Template
        DB::table('document_templates')->insertOrIgnore([
            'id' => 1,
            'name' => 'Admissions Offer Letter',
            'type' => 'OfferLetter',
            'html_content' => '
<div style="font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6;">
    <div style="text-align: center; border-bottom: 2px solid #2d3748; padding-bottom: 15px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px; color: #1a365d;">ARABIC COLLEGE FOR SHARIA STUDIES</h1>
        <p style="margin: 5px 0 0; font-size: 12px; color: #718096; text-transform: uppercase;">Official Admission Offer</p>
    </div>
    
    <p style="text-align: right;">Date: <strong>{{DATE}}</strong></p>
    <p>To,<br>
    <strong>{{STUDENT_NAME}}</strong><br>
    Registration No: {{STUDENT_ID}}</p>
    
    <h3 style="color: #1a365d; margin-top: 25px;">Subject: Admission Offer for {{PROGRAM_NAME}}</h3>
    
    <p>Dear {{STUDENT_NAME}},</p>
    
    <p>We are pleased to inform you that you have been selected for admission to the <strong>{{PROGRAM_NAME}}</strong> program at the Arabic College for Sharia Studies for the upcoming academic session.</p>
    
    <p>Your academic records show outstanding potential, and we are confident that you will contribute significantly to our scholarly community. Please review the registration steps and fee schedules inside your applicant portal to secure your seat.</p>
    
    <p>We look forward to welcoming you to our campus.</p>
    
    <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
            <p style="margin-bottom: 50px;">Sincerely,</p>
            <p style="margin: 0; font-weight: bold; border-top: 1px solid #333; display: inline-block; padding-top: 5px;">Dean of Academic Affairs</p>
        </div>
        <div style="text-align: right;">
            {{QR_CODE}}
            <p style="margin: 5px 0 0; font-size: 9px; color: #a0aec0;">Document Ref: {{DOC_NUMBER}}</p>
        </div>
    </div>
</div>',
            'css_content' => 'body { background: #fff; }',
            'qr_enabled' => true,
            'signature_enabled' => true,
            'signature_title' => 'Dean of Academic Affairs',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Hifz Graduation Certificate
        DB::table('document_templates')->insertOrIgnore([
            'id' => 2,
            'name' => 'Certificate of Hifz Completion',
            'type' => 'Certificate',
            'html_content' => '
<div style="font-family: Garamond, serif; padding: 50px; text-align: center; border: 15px double #1a365d; background: #fffdf5; color: #2d3748; line-height: 1.8;">
    <div style="color: #1a365d; font-size: 28px; font-weight: bold; margin-bottom: 5px;">ARABIC COLLEGE</div>
    <div style="font-style: italic; font-size: 14px; letter-spacing: 2px; color: #718096; margin-bottom: 25px;">MEMORIZATION ACADEMY CERTIFICATE</div>
    
    <h2 style="font-family: Georgia, serif; font-size: 32px; font-weight: normal; margin: 20px 0; color: #805ad5;">شهادة حفظ القرآن الكريم</h2>
    
    <p style="font-size: 18px; margin: 20px 0;">This is to certify that</p>
    <h1 style="font-family: Georgia, serif; font-size: 36px; color: #1a365d; text-decoration: underline; margin: 10px 0;">{{STUDENT_NAME}}</h1>
    
    <p style="font-size: 18px; max-width: 600px; margin: 20px auto;">
        has successfully completed the memorization of the Holy Quran in its entirety and has demonstrated mastery over the rules of Tajweed.
    </p>
    
    <p style="font-size: 16px; margin-top: 30px;">Awarded on: <strong>{{DATE}}</strong></p>
    
    <div style="margin-top: 50px; display: flex; justify-content: space-around; align-items: center;">
        <div style="text-align: center;">
            <div style="width: 150px; border-bottom: 1px solid #718096; margin: 30px auto 5px;"></div>
            <span style="font-size: 12px; color: #718096;">Head of Quranic Studies</span>
        </div>
        <div>
            {{QR_CODE}}
            <div style="font-size: 9px; color: #a0aec0; margin-top: 5px;">Ref: {{DOC_NUMBER}}</div>
        </div>
        <div style="text-align: center;">
            <div style="width: 150px; border-bottom: 1px solid #718096; margin: 30px auto 5px;"></div>
            <span style="font-size: 12px; color: #718096;">Registrar Seal</span>
        </div>
    </div>
</div>',
            'css_content' => 'body { background: #fffdf5; }',
            'qr_enabled' => true,
            'signature_enabled' => true,
            'signature_title' => 'Head of Quranic Studies',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_documents');
        Schema::dropIfExists('document_templates');
    }
};
