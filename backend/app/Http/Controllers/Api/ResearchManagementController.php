<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\ResearchPaper;
use App\Models\ResearchPaperVersion;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ResearchManagementController extends Controller
{
    // =========================================================================
    // LOOKUPS
    // =========================================================================

    public function getSupervisors(): JsonResponse
    {
        // Find teachers/staff who can act as research supervisors
        $supervisors = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['Teacher', 'admin', 'Staff']);
        })->orderBy('name')->get(['id', 'name', 'email']);

        return ApiResponse::success($supervisors, 'Supervisors list loaded.');
    }

    public function getCategories(): JsonResponse
    {
        return ApiResponse::success([
            'Sharia Law & Fiqh',
            'Quranic Exegesis (Tafsir)',
            'Hadith Studies & Authenticity',
            'Arabic Grammar & Syntax (Nahw/Sarf)',
            'Islamic History & Culture',
            'Comparative Religion',
            'General Education & Science'
        ], 'Research categories loaded.');
    }

    // =========================================================================
    // PAPERS DIRECTORY (LIST & DETAILS)
    // =========================================================================

    public function getPapers(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = ResearchPaper::with(['user', 'supervisor', 'latestVersion', 'versions']);

        // Roles check
        $roles = $user->roles->pluck('name')->toArray();
        $isSupervisor = in_array('Teacher', $roles) || in_array('admin', $roles) || in_array('Staff', $roles);

        if (!$isSupervisor) {
            // Student only sees their own papers
            $query->where('user_id', $user->id);
        } else {
            // Supervisor sees papers submitted to them, or all if admin
            if (!in_array('admin', $roles)) {
                $query->where(function ($q) use ($user) {
                    $q->where('supervisor_user_id', $user->id)
                      ->orWhere('user_id', $user->id);
                });
            }
        }

        // Apply filters
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('keywords', 'like', "%{$search}%");
            });
        }

        $papers = $query->orderBy('updated_at', 'desc')->paginate(15);
        return ApiResponse::success($papers, 'Research papers loaded.');
    }

    public function getPaper($id): JsonResponse
    {
        $paper = ResearchPaper::with(['user', 'supervisor', 'versions' => function ($q) {
            $q->orderBy('version_number', 'desc');
        }, 'latestVersion'])->findOrFail($id);

        // Security check
        $user = Auth::user();
        $roles = $user->roles->pluck('name')->toArray();
        $isSupervisor = in_array('Teacher', $roles) || in_array('admin', $roles) || in_array('Staff', $roles);

        if (!$isSupervisor && $paper->user_id !== $user->id) {
            return ApiResponse::error('Unauthorized access to this research paper.', 403);
        }

        return ApiResponse::success($paper, 'Research paper details loaded.');
    }

    // =========================================================================
    // UPLOAD & VERSION HISTORY
    // =========================================================================

    public function storePaper(Request $request): JsonResponse
    {
        $request->validate([
            'title'              => ['required', 'string', 'max:255'],
            'abstract'           => ['nullable', 'string'],
            'category'           => ['required', 'string'],
            'keywords'           => ['nullable', 'string'],
            'supervisor_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'file'               => ['required', 'file', 'mimes:pdf', 'max:15360'], // max 15MB PDF
            'notes'              => ['nullable', 'string', 'max:500'],
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();

            $paper = ResearchPaper::create([
                'user_id'            => $user->id,
                'supervisor_user_id' => $request->supervisor_user_id,
                'title'              => $request->title,
                'abstract'           => $request->abstract,
                'category'           => $request->category,
                'keywords'           => $request->keywords,
                'status'             => 'Draft',
            ]);

            // Save PDF securely
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            
            // Secure store - file is saved outside public visibility in secure_research
            $path = $file->store('secure_research');

            ResearchPaperVersion::create([
                'research_paper_id' => $paper->id,
                'version_number'    => 1,
                'file_path'         => $path,
                'original_filename' => $originalName,
                'notes'             => $request->notes ?? 'Initial Upload',
            ]);

            DB::commit();
            return ApiResponse::success($paper->load('latestVersion'), 'Research paper registered as Draft.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Upload failed: ' . $e->getMessage(), 500);
        }
    }

    public function uploadNewVersion(Request $request, $id): JsonResponse
    {
        $request->validate([
            'file'  => ['required', 'file', 'mimes:pdf', 'max:15360'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $paper = ResearchPaper::findOrFail($id);
        $user  = Auth::user();

        if ($paper->user_id !== $user->id) {
            return ApiResponse::error('Only the owner can upload new versions.', 403);
        }

        // Locked status check
        if (in_array($paper->status, ['Submitted', 'Under Review'])) {
            return ApiResponse::error('Cannot add versions while paper is currently undergoing active review.', 409);
        }

        DB::beginTransaction();
        try {
            // Increment version count
            $nextVersion = $paper->versions()->max('version_number') + 1;

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $path = $file->store('secure_research');

            ResearchPaperVersion::create([
                'research_paper_id' => $paper->id,
                'version_number'    => $nextVersion,
                'file_path'         => $path,
                'original_filename' => $originalName,
                'notes'             => $request->notes ?? "Version {$nextVersion} update",
            ]);

            // Reset status back to Draft if it was Rejected earlier
            if ($paper->status === 'Rejected') {
                $paper->update(['status' => 'Draft']);
            }

            DB::commit();
            return ApiResponse::success($paper->load(['versions', 'latestVersion']), 'New version registered successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Version upload failed: ' . $e->getMessage(), 500);
        }
    }

    // =========================================================================
    // WORKFLOW TRANSITIONS
    // =========================================================================

    public function submitPaper($id): JsonResponse
    {
        $paper = ResearchPaper::findOrFail($id);
        $user  = Auth::user();

        if ($paper->user_id !== $user->id) {
            return ApiResponse::error('Only the owner can submit this paper.', 403);
        }

        if ($paper->status !== 'Draft') {
            return ApiResponse::error('Paper is already submitted or processed.', 409);
        }

        $paper->update(['status' => 'Submitted']);
        return ApiResponse::success($paper, 'Research paper submitted to supervisor for review.');
    }

    public function processWorkflow(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status'  => ['required', 'string', 'in:Under Review,Approved,Rejected'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $paper = ResearchPaper::findOrFail($id);
        $user  = Auth::user();
        $roles = $user->roles->pluck('name')->toArray();
        
        $isSupervisor = $paper->supervisor_user_id === $user->id;
        $isAdmin = in_array('admin', $roles);

        if (!$isSupervisor && !$isAdmin) {
            return ApiResponse::error('Only the designated supervisor or admin can review this paper.', 403);
        }

        $paper->update([
            'status'  => $request->status,
            'remarks' => $request->remarks,
        ]);

        return ApiResponse::success($paper, "Paper status set to '{$request->status}'.");
    }

    // =========================================================================
    // SECURE STORAGE - PREVIEW & DOWNLOAD
    // =========================================================================

    public function previewVersion($versionId)
    {
        $version = ResearchPaperVersion::with('paper')->findOrFail($versionId);
        $user    = Auth::user();

        // Authority validation
        $roles = $user->roles->pluck('name')->toArray();
        $isSupervisor = in_array('Teacher', $roles) || in_array('admin', $roles) || in_array('Staff', $roles);

        if (!$isSupervisor && $version->paper->user_id !== $user->id) {
            abort(403, 'Unauthorized access to this document.');
        }

        $path = $version->file_path;
        if (!Storage::exists($path)) {
            abort(404, 'Physical file not found in secure vault storage.');
        }

        // Return inline stream response for PDF preview
        return response()->file(Storage::path($path), [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $version->original_filename . '"'
        ]);
    }

    public function downloadVersion($versionId)
    {
        $version = ResearchPaperVersion::with('paper')->findOrFail($versionId);
        $user    = Auth::user();

        $roles = $user->roles->pluck('name')->toArray();
        $isSupervisor = in_array('Teacher', $roles) || in_array('admin', $roles) || in_array('Staff', $roles);

        if (!$isSupervisor && $version->paper->user_id !== $user->id) {
            abort(403, 'Unauthorized access to this document.');
        }

        $path = $version->file_path;
        if (!Storage::exists($path)) {
            abort(404, 'Physical file not found in secure vault storage.');
        }

        // Log research paper file download
        \App\Models\AuditLog::create([
            'user_id' => $user->id,
            'action' => 'file_download',
            'model_type' => ResearchPaperVersion::class,
            'model_id' => $version->id,
            'new_values' => ['filename' => $version->original_filename, 'type' => 'research_paper_download'],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return response()->download(Storage::path($path), $version->original_filename);
    }
}
