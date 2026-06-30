<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\AcademicYear;
use App\Models\Backup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SystemSettingsController extends Controller
{
    /**
     * Display a listing of the settings.
     */
    public function index()
    {
        $settings = Setting::all()->mapWithKeys(function ($setting) {
            // Decode JSON strings if applicable
            $value = $setting->value;
            if ($setting->type === 'json' && $value) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $value = $decoded;
                }
            } elseif ($setting->type === 'boolean') {
                $value = (bool)$value;
            } elseif ($setting->type === 'integer') {
                $value = (int)$value;
            }
            return [$setting->key => $value];
        });

        $academicYears = AcademicYear::orderBy('id', 'desc')->get();
        $backups = Backup::with('initiator')->orderBy('id', 'desc')->get();

        return response()->json([
            'settings' => $settings,
            'academic_years' => $academicYears,
            'backups' => $backups
        ]);
    }

    /**
     * Update settings in bulk.
     */
    public function update(Request $request)
    {
        $settingsData = $request->input('settings', []);

        foreach ($settingsData as $key => $value) {
            $setting = Setting::where('key', $key)->first();
            if ($setting) {
                if ($setting->type === 'json' || is_array($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                } elseif ($setting->type === 'boolean') {
                    $value = $value ? '1' : '0';
                }
                $setting->value = $value;
                $setting->save();
            }
        }

        // Handle active academic year update if provided
        if ($request->has('active_academic_year_id')) {
            $activeYearId = $request->input('active_academic_year_id');
            AcademicYear::query()->update(['is_active' => false]);
            AcademicYear::where('id', $activeYearId)->update(['is_active' => true]);
        }

        return response()->json(['message' => 'Settings updated successfully.']);
    }

    /**
     * Upload college logo.
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:4096'
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $logoUrl = '/storage/' . $path;

            Setting::updateOrCreate(
                ['key' => 'college_logo'],
                ['value' => $logoUrl, 'type' => 'string']
            );

            return response()->json([
                'logo_url' => $logoUrl,
                'message' => 'Logo uploaded successfully.'
            ]);
        }

        return response()->json(['message' => 'No logo file provided.'], 400);
    }

    /**
     * Trigger database backup.
     */
    public function triggerBackup(Request $request)
    {
        try {
            $fileName = 'asc_backup_' . time() . '.sql';
            $filePath = 'backups/' . $fileName;

            // Generate mock backup content listing schema stats
            $content = "-- ASC Database Backup Mockup --\n";
            $content .= "-- Generated: " . now() . "\n";
            $content .= "-- Mode: Local File System Storage\n\n";
            $content .= "SET FOREIGN_KEY_CHECKS=0;\n";
            $content .= "TRUNCATE TABLE settings;\n";
            
            $settings = Setting::all();
            foreach ($settings as $s) {
                $content .= "INSERT INTO settings (id, `key`, `value`, `type`) VALUES ({$s->id}, '{$s->key}', '" . addslashes($s->value) . "', '{$s->type}');\n";
            }

            Storage::disk('local')->put($filePath, $content);
            $fileSize = Storage::disk('local')->size($filePath);

            $backup = Backup::create([
                'file_name' => $fileName,
                'file_path' => $filePath,
                'file_size_bytes' => $fileSize,
                'backup_status_id' => 1, // Success
                'initiated_by_user_id' => auth()->id() ?? 1,
            ]);

            // Reload initiator relation
            $backup->load('initiator');

            return response()->json([
                'backup' => $backup,
                'message' => 'Database backup created successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Backup trigger failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to initiate backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mock restore database from backup.
     */
    public function restoreBackup($id)
    {
        $backup = Backup::findOrFail($id);

        if (Storage::disk('local')->exists($backup->file_path)) {
            // Simulation is complete.
            return response()->json([
                'message' => "Database restored successfully from backup file: {$backup->file_name}"
            ]);
        }

        return response()->json([
            'message' => 'Backup file not found on disk storage.'
        ], 404);
    }

    /**
     * Download backup file.
     */
    public function downloadBackup($id)
    {
        $backup = Backup::findOrFail($id);

        if (Storage::disk('local')->exists($backup->file_path)) {
            return Storage::disk('local')->download($backup->file_path, $backup->file_name);
        }

        return response()->json([
            'message' => 'Backup file does not exist.'
        ], 404);
    }
}
