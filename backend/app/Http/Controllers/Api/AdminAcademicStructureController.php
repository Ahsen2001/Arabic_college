<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Program;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\CurriculumItem;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAcademicStructureController extends Controller
{
    // =========================================================================
    // DEPARTMENTS
    // =========================================================================

    public function getDepartments(): JsonResponse
    {
        $departments = Department::all();
        return ApiResponse::success($departments, 'Departments retrieved.');
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'unique:departments,code'],
            'head_teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
        ]);

        $dept = Department::create($request->all());
        return ApiResponse::success($dept, 'Department created successfully.');
    }

    public function updateDepartment(Request $request, $id): JsonResponse
    {
        $dept = Department::find($id);
        if (!$dept) {
            return ApiResponse::error('Department not found.', 404);
        }

        $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'unique:departments,code,' . $id],
            'head_teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
        ]);

        $dept->update($request->all());
        return ApiResponse::success($dept, 'Department updated successfully.');
    }

    // =========================================================================
    // PROGRAMS
    // =========================================================================

    public function getPrograms(): JsonResponse
    {
        $programs = Program::with('department')->get();
        return ApiResponse::success($programs, 'Programs retrieved.');
    }

    public function storeProgram(Request $request): JsonResponse
    {
        $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'unique:programs,code'],
            'duration_years' => ['required', 'integer', 'min:1', 'max:6'],
            'total_credits' => ['required', 'integer', 'min:1'],
        ]);

        $program = Program::create($request->all());
        return ApiResponse::success($program, 'Program created successfully.');
    }

    public function updateProgram(Request $request, $id): JsonResponse
    {
        $program = Program::find($id);
        if (!$program) {
            return ApiResponse::error('Program not found.', 404);
        }

        $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'unique:programs,code,' . $id],
            'duration_years' => ['required', 'integer', 'min:1', 'max:6'],
            'total_credits' => ['required', 'integer', 'min:1'],
        ]);

        $program->update($request->all());
        return ApiResponse::success($program, 'Program updated successfully.');
    }

    // =========================================================================
    // ACADEMIC YEARS
    // =========================================================================

    public function getAcademicYears(): JsonResponse
    {
        $years = AcademicYear::orderBy('start_date', 'desc')->get();
        return ApiResponse::success($years, 'Academic years retrieved.');
    }

    public function storeAcademicYear(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'unique:academic_years,name'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::beginTransaction();
        try {
            if ($request->is_active) {
                AcademicYear::query()->update(['is_active' => false]);
            }
            $year = AcademicYear::create($request->all());
            DB::commit();
            return ApiResponse::success($year, 'Academic year created.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error($e->getMessage());
        }
    }

    public function updateAcademicYear(Request $request, $id): JsonResponse
    {
        $year = AcademicYear::find($id);
        if (!$year) {
            return ApiResponse::error('Academic year not found.', 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'unique:academic_years,name,' . $id],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::beginTransaction();
        try {
            if ($request->is_active) {
                AcademicYear::query()->update(['is_active' => false]);
            }
            $year->update($request->all());
            DB::commit();
            return ApiResponse::success($year, 'Academic year updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error($e->getMessage());
        }
    }

    // =========================================================================
    // SEMESTERS
    // =========================================================================

    public function getSemesters(): JsonResponse
    {
        $semesters = Semester::with('academicYear')->orderBy('start_date', 'desc')->get();
        return ApiResponse::success($semesters, 'Semesters retrieved.');
    }

    public function storeSemester(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'name' => ['required', 'string'],
            'code' => ['required', 'string', 'unique:semesters,code'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::beginTransaction();
        try {
            if ($request->is_active) {
                Semester::query()->update(['is_active' => false]);
            }
            $semester = Semester::create($request->all());
            DB::commit();
            return ApiResponse::success($semester, 'Semester created.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error($e->getMessage());
        }
    }

    public function updateSemester(Request $request, $id): JsonResponse
    {
        $semester = Semester::find($id);
        if (!$semester) {
            return ApiResponse::error('Semester not found.', 404);
        }

        $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'name' => ['required', 'string'],
            'code' => ['required', 'string', 'unique:semesters,code,' . $id],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::beginTransaction();
        try {
            if ($request->is_active) {
                Semester::query()->update(['is_active' => false]);
            }
            $semester->update($request->all());
            DB::commit();
            return ApiResponse::success($semester, 'Semester updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error($e->getMessage());
        }
    }

    // =========================================================================
    // SUBJECTS & PREREQUISITES
    // =========================================================================

    public function getSubjects(): JsonResponse
    {
        $subjects = Subject::with(['department', 'prerequisites'])->get();
        return ApiResponse::success($subjects, 'Subjects registry retrieved.');
    }

    public function storeSubject(Request $request): JsonResponse
    {
        $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'unique:subjects,code'],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:6'],
            'description' => ['nullable', 'string'],
            'prerequisite_ids' => ['nullable', 'array'],
            'prerequisite_ids.*' => ['integer', 'exists:subjects,id'],
        ]);

        DB::beginTransaction();
        try {
            $subject = Subject::create($request->only([
                'department_id', 'name_ar', 'name_en', 'code', 'credit_hours', 'description'
            ]));

            if ($request->has('prerequisite_ids')) {
                $subject->prerequisites()->sync($request->prerequisite_ids);
            }

            DB::commit();
            return ApiResponse::success($subject, 'Subject and prerequisites created.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error($e->getMessage());
        }
    }

    public function updateSubject(Request $request, $id): JsonResponse
    {
        $subject = Subject::find($id);
        if (!$subject) {
            return ApiResponse::error('Subject not found.', 404);
        }

        $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'unique:subjects,code,' . $id],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:6'],
            'description' => ['nullable', 'string'],
            'prerequisite_ids' => ['nullable', 'array'],
            'prerequisite_ids.*' => ['integer', 'exists:subjects,id'],
        ]);

        DB::beginTransaction();
        try {
            $subject->update($request->only([
                'department_id', 'name_ar', 'name_en', 'code', 'credit_hours', 'description'
            ]));

            if ($request->has('prerequisite_ids')) {
                $subject->prerequisites()->sync($request->prerequisite_ids);
            }

            DB::commit();
            return ApiResponse::success($subject, 'Subject details updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error($e->getMessage());
        }
    }

    // =========================================================================
    // CURRICULUM
    // =========================================================================

    public function getCurriculum($programId): JsonResponse
    {
        $curriculum = CurriculumItem::with('subject')
            ->where('program_id', $programId)
            ->orderBy('semester_period')
            ->get();

        return ApiResponse::success($curriculum, 'Program curriculum retrieved.');
    }

    public function syncCurriculum(Request $request, $programId): JsonResponse
    {
        $request->validate([
            'curriculum' => ['required', 'array'],
            'curriculum.*.subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'curriculum.*.semester_period' => ['required', 'integer', 'min:1', 'max:12'],
            'curriculum.*.is_elective' => ['required', 'boolean'],
        ]);

        DB::beginTransaction();
        try {
            CurriculumItem::where('program_id', $programId)->delete();

            foreach ($request->curriculum as $item) {
                CurriculumItem::create([
                    'program_id' => $programId,
                    'subject_id' => $item['subject_id'],
                    'semester_period' => $item['semester_period'],
                    'is_elective' => $item['is_elective'],
                ]);
            }

            DB::commit();
            return ApiResponse::success(null, 'Program curriculum synced successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error($e->getMessage());
        }
    }

    // =========================================================================
    // COURSES & ALLOCATIONS
    // =========================================================================

    public function getCourses(Request $request): JsonResponse
    {
        $query = Course::with(['subject', 'semester', 'teacher.user']);

        if ($request->has('semester_id') && !empty($request->semester_id)) {
            $query->where('semester_id', $request->semester_id);
        }

        $courses = $query->orderBy('code')->get();
        return ApiResponse::success($courses, 'Course sections list retrieved.');
    }

    public function storeCourse(Request $request): JsonResponse
    {
        $request->validate([
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
            'code' => ['required', 'string', 'unique:courses,code'],
            'section' => ['required', 'string'],
            'capacity' => ['required', 'integer', 'min:1'],
        ]);

        $course = Course::create($request->all());
        return ApiResponse::success($course, 'Course section created successfully.');
    }

    public function updateCourse(Request $request, $id): JsonResponse
    {
        $course = Course::find($id);
        if (!$course) {
            return ApiResponse::error('Course section not found.', 404);
        }

        $request->validate([
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
            'code' => ['required', 'string', 'unique:courses,code,' . $id],
            'section' => ['required', 'string'],
            'capacity' => ['required', 'integer', 'min:1'],
        ]);

        $course->update($request->all());
        return ApiResponse::success($course, 'Course section allocated successfully.');
    }
}
