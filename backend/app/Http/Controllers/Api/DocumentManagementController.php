<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\DocumentTemplate;
use App\Models\GeneratedDocument;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class DocumentManagementController extends Controller
{
    // =========================================================================
    // TEMPLATE CRUD
    // =========================================================================

    public function getTemplates(): JsonResponse
    {
        $templates = DocumentTemplate::orderBy('name')->get();
        return ApiResponse::success($templates, 'Document templates loaded.');
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'type'             => ['required', 'in:OfferLetter,Certificate,IDCard,Transcript,CharacterCertificate,Custom'],
            'html_content'     => ['required', 'string'],
            'css_content'      => ['nullable', 'string'],
            'qr_enabled'       => ['boolean'],
            'signature_enabled'=> ['boolean'],
            'signature_title'  => ['nullable', 'string'],
        ]);

        $template = DocumentTemplate::create($request->all());
        return ApiResponse::success($template, 'Document template created.');
    }

    public function updateTemplate(Request $request, $id): JsonResponse
    {
        $template = DocumentTemplate::findOrFail($id);
        $template->update($request->all());
        return ApiResponse::success($template, 'Document template updated.');
    }

    public function deleteTemplate($id): JsonResponse
    {
        $template = DocumentTemplate::findOrFail($id);
        $template->delete();
        return ApiResponse::success(null, 'Template deleted.');
    }

    // =========================================================================
    // DOCUMENT GENERATION & EXPORT
    // =========================================================================

    public function generateDocument(Request $request): JsonResponse
    {
        $request->validate([
            'student_id'           => ['required', 'integer', 'exists:students,id'],
            'document_template_id' => ['required', 'integer', 'exists:document_templates,id'],
        ]);

        $student  = Student::with(['user', 'program'])->findOrFail($request->student_id);
        $template = DocumentTemplate::findOrFail($request->document_template_id);

        // Generate unique numbers
        $docNum = 'AC-DOC-' . now()->year . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $token  = Str::uuid()->toString();

        // ── Placeholders parsing ──────────────────────────────────────────────
        $html = $template->html_content;

        // Simulate QR Code representation
        $verificationUrl = url("/verify-document/{$token}");
        $qrHtml = "
<div style='display: inline-block; padding: 6px; background: #fff; border: 1px solid #cbd5e0; text-align: center;'>
    <div style='font-size: 10px; font-weight: bold; color: #1a365d;'>VERIFIED</div>
    <div style='font-size: 8px; color: #718096;'>Scan to Verify</div>
    <div style='font-size: 7px; color: #a0aec0; margin-top: 3px;'>$docNum</div>
</div>";

        $replacements = [
            '{{STUDENT_NAME}}'  => $student->user?->name ?? 'Student Name',
            '{{STUDENT_ID}}'    => $student->student_id_number ?? 'STU-ID',
            '{{PROGRAM_NAME}}'  => $student->program?->name ?? 'Sharia Course',
            '{{DATE}}'          => now()->toLocaleDateString('en-GB', ['day' => '2-digit', 'month' => 'long', 'year' => 'numeric']),
            '{{DOC_NUMBER}}'    => $docNum,
            '{{QR_CODE}}'       => $qrHtml,
        ];

        $renderedHtml = str_replace(array_keys($replacements), array_values($replacements), $html);
        // ─────────────────────────────────────────────────────────────────────

        DB::beginTransaction();
        try {
            $genDoc = GeneratedDocument::create([
                'student_id'           => $student->id,
                'document_template_id' => $template->id,
                'document_number'      => $docNum,
                'verification_token'   => $token,
                'file_path'            => null,
            ]);

            DB::commit();

            return ApiResponse::success([
                'id'                 => $genDoc->id,
                'document_number'    => $docNum,
                'verification_token' => $token,
                'html'               => $renderedHtml,
                'css'                => $template->css_content,
            ], 'Document generated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Generation failed: ' . $e->getMessage(), 500);
        }
    }

    public function downloadPdf(Request $request)
    {
        $request->validate([
            'html' => ['required', 'string'],
            'css'  => ['nullable', 'string'],
        ]);

        $fullHtml = "
<html>
<head>
    <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; }
        " . ($request->css ?? '') . "
    </style>
</head>
<body>
    " . $request->html . "
</body>
</html>";

        // Generate PDF securely using DomPDF
        $pdf = Pdf::loadHTML($fullHtml);
        return $pdf->download('academic_document.pdf');
    }

    // =========================================================================
    // PUBLIC QR VERIFICATION LOOKUP
    // =========================================================================

    public function verifyDocument($token): JsonResponse
    {
        $doc = GeneratedDocument::with([
            'student.user',
            'student.program',
            'template'
        ])
        ->where('verification_token', $token)
        ->orWhere('document_number', $token)
        ->first();

        if (!$doc) {
            return ApiResponse::error('This document record was not found or is invalid.', 404);
        }

        return ApiResponse::success([
            'is_authentic'    => true,
            'document_number' => $doc->document_number,
            'type'            => $doc->template?->type,
            'name'            => $doc->template?->name,
            'student_name'    => $doc->student?->user?->name,
            'student_id'      => $doc->student?->student_id_number,
            'course'          => $doc->student?->program?->name,
            'generated_at'    => $doc->created_at->toDateTimeString(),
        ], 'Document authenticity verified successfully.');
    }
}
