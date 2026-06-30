<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\TimetableAllocation;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TimetableManagementController extends Controller
{
    // =========================================================================
    // CLASSROOM CATALOGUE
    // =========================================================================

    public function getRooms(): JsonResponse
    {
        $rooms = Classroom::where('is_active', true)->orderBy('name')->get();
        return ApiResponse::success($rooms, 'Classrooms list loaded.');
    }

    public function storeRoom(Request $request): JsonResponse
    {
        $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'building'     => ['nullable', 'string', 'max:100'],
            'type'         => ['nullable', 'string', 'in:Classroom,Lab,Hall,Seminar'],
            'capacity'     => ['required', 'integer', 'min:1'],
            'has_projector'=> ['boolean'],
            'has_ac'       => ['boolean'],
        ]);

        $room = Classroom::create($request->only([
            'name', 'building', 'type', 'capacity', 'has_projector', 'has_ac',
        ]));

        return ApiResponse::success($room, 'Classroom registered.');
    }

    public function updateRoom(Request $request, $roomId): JsonResponse
    {
        $room = Classroom::find($roomId);
        if (!$room) {
            return ApiResponse::error('Room not found.', 404);
        }
        $room->update($request->only([
            'name', 'building', 'type', 'capacity', 'has_projector', 'has_ac', 'is_active',
        ]));
        return ApiResponse::success($room, 'Classroom updated.');
    }

    // =========================================================================
    // TIMETABLE SLOTS — CRUD
    // =========================================================================

    public function getSlots(Request $request): JsonResponse
    {
        $query = TimetableAllocation::with([
            'course.subject',
            'course.semester',
            'course.program',
            'teacher',
            'room',
        ]);

        // Optional filters
        if ($request->filled('teacher_user_id')) {
            $query->where('teacher_user_id', $request->teacher_user_id);
        }
        if ($request->filled('classroom_id')) {
            $query->where('classroom_id', $request->classroom_id);
        }
        if ($request->filled('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }

        $slots = $query->orderBy('day_of_week')->orderBy('start_time')->get();
        return ApiResponse::success($slots, 'Timetable slots loaded.');
    }

    public function storeSlot(Request $request): JsonResponse
    {
        $request->validate([
            'course_id'       => ['required', 'integer', 'exists:courses,id'],
            'teacher_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'classroom_id'    => ['nullable', 'integer', 'exists:classrooms,id'],
            'day_of_week'     => ['required', 'integer', 'min:1', 'max:7'],
            'start_time'      => ['required', 'date_format:H:i'],
            'end_time'        => ['required', 'date_format:H:i', 'after:start_time'],
            'notes'           => ['nullable', 'string'],
        ]);

        // ── Conflict detection ────────────────────────────────────────────────
        $conflicts = $this->detectConflicts(
            $request->day_of_week,
            $request->start_time,
            $request->end_time,
            $request->teacher_user_id,
            $request->classroom_id,
        );

        if ($conflicts['has_conflict']) {
            return ApiResponse::error(
                'Scheduling conflict detected: ' . $conflicts['message'],
                409
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        $slot = TimetableAllocation::create([
            'course_id'       => $request->course_id,
            'teacher_user_id' => $request->teacher_user_id,
            'classroom_id'    => $request->classroom_id,
            'day_of_week'     => $request->day_of_week,
            'start_time'      => $request->start_time,
            'end_time'        => $request->end_time,
            'classroom'       => $request->classroom ?? '',
            'notes'           => $request->notes,
        ]);

        return ApiResponse::success(
            $slot->load(['course.subject', 'teacher', 'room']),
            'Timetable slot added.'
        );
    }

    public function updateSlot(Request $request, $slotId): JsonResponse
    {
        $slot = TimetableAllocation::find($slotId);
        if (!$slot) {
            return ApiResponse::error('Slot not found.', 404);
        }

        $request->validate([
            'teacher_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'classroom_id'    => ['nullable', 'integer', 'exists:classrooms,id'],
            'day_of_week'     => ['required', 'integer', 'min:1', 'max:7'],
            'start_time'      => ['required', 'date_format:H:i'],
            'end_time'        => ['required', 'date_format:H:i', 'after:start_time'],
            'notes'           => ['nullable', 'string'],
        ]);

        $conflicts = $this->detectConflicts(
            $request->day_of_week,
            $request->start_time,
            $request->end_time,
            $request->teacher_user_id,
            $request->classroom_id,
            $slotId  // exclude self
        );

        if ($conflicts['has_conflict']) {
            return ApiResponse::error(
                'Scheduling conflict detected: ' . $conflicts['message'],
                409
            );
        }

        $slot->update($request->only([
            'teacher_user_id', 'classroom_id', 'day_of_week', 'start_time', 'end_time', 'notes',
        ]));

        return ApiResponse::success($slot->fresh(['course.subject', 'teacher', 'room']), 'Slot updated.');
    }

    public function deleteSlot($slotId): JsonResponse
    {
        $slot = TimetableAllocation::find($slotId);
        if (!$slot) {
            return ApiResponse::error('Slot not found.', 404);
        }
        $slot->delete();
        return ApiResponse::success(null, 'Timetable slot removed.');
    }

    // =========================================================================
    // CONFLICT DETECTION ENGINE
    // =========================================================================

    /**
     * Returns conflict status for a given time window on a given day.
     * Checks both teacher double-booking and room double-booking.
     */
    private function detectConflicts(
        int    $day,
        string $start,
        string $end,
        ?int   $teacherId,
        ?int   $roomId,
        ?int   $excludeSlotId = null
    ): array {
        $baseQuery = TimetableAllocation::where('day_of_week', $day)
            ->where(function ($q) use ($start, $end) {
                // Overlap: existing.start < new.end AND existing.end > new.start
                $q->where('start_time', '<', $end)
                  ->where('end_time', '>', $start);
            });

        if ($excludeSlotId) {
            $baseQuery->where('id', '!=', $excludeSlotId);
        }

        // Teacher conflict
        if ($teacherId) {
            $teacherConflict = (clone $baseQuery)
                ->where('teacher_user_id', $teacherId)
                ->first();

            if ($teacherConflict) {
                $teacher = User::find($teacherId);
                return [
                    'has_conflict' => true,
                    'message'      => "Teacher '{$teacher?->name}' is already scheduled at this time.",
                ];
            }
        }

        // Room conflict
        if ($roomId) {
            $roomConflict = (clone $baseQuery)
                ->where('classroom_id', $roomId)
                ->first();

            if ($roomConflict) {
                $room = Classroom::find($roomId);
                return [
                    'has_conflict' => true,
                    'message'      => "Room '{$room?->name}' is already booked at this time.",
                ];
            }
        }

        return ['has_conflict' => false, 'message' => ''];
    }

    // =========================================================================
    // ANALYTICS: ROOM UTILISATION + TEACHER LOAD
    // =========================================================================

    public function getAnalytics(): JsonResponse
    {
        // Weekly slot counts per room
        $roomUtilisation = DB::table('timetable_allocations')
            ->join('classrooms', 'timetable_allocations.classroom_id', '=', 'classrooms.id')
            ->select('classrooms.name', DB::raw('count(timetable_allocations.id) as slot_count'))
            ->groupBy('classrooms.name')
            ->pluck('slot_count', 'name');

        // Weekly slot counts per teacher
        $teacherLoad = DB::table('timetable_allocations')
            ->join('users', 'timetable_allocations.teacher_user_id', '=', 'users.id')
            ->select('users.name', DB::raw('count(timetable_allocations.id) as slot_count'))
            ->groupBy('users.name')
            ->pluck('slot_count', 'name');

        return ApiResponse::success([
            'room_utilisation' => $roomUtilisation,
            'teacher_load'     => $teacherLoad,
        ], 'Timetable analytics compiled.');
    }
}
