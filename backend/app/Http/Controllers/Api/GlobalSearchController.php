<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Application;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\Book;
use App\Models\ResearchPaper;
use App\Models\Document;
use App\Models\StudentAttendance;
use App\Models\ExamResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    /**
     * Perform global lookup across 9 domains.
     */
    public function search(Request $request): JsonResponse
    {
        $q = $request->query('q', '');
        $type = $request->query('type', '');

        // If a specific type is requested, return paginated results for that type
        if (!empty($type)) {
            $results = $this->searchByType($type, $q);
            return ApiResponse::success($results, "Search results for '{$type}' retrieved successfully.");
        }

        // Otherwise, return grouped results (up to 10 items per category)
        $groupedResults = [
            'students' => $this->formatGrouped('students', $this->searchStudents($q, 10)),
            'applicants' => $this->formatGrouped('applicants', $this->searchApplicants($q, 10)),
            'teachers' => $this->formatGrouped('teachers', $this->searchTeachers($q, 10)),
            'subjects' => $this->formatGrouped('subjects', $this->searchSubjects($q, 10)),
            'books' => $this->formatGrouped('books', $this->searchBooks($q, 10)),
            'research' => $this->formatGrouped('research', $this->searchResearch($q, 10)),
            'documents' => $this->formatGrouped('documents', $this->searchDocuments($q, 10)),
            'attendance' => $this->formatGrouped('attendance', $this->searchAttendance($q, 10)),
            'results' => $this->formatGrouped('results', $this->searchResults($q, 10)),
        ];

        return ApiResponse::success($groupedResults, 'Global search results retrieved successfully.');
    }

    private function searchByType(string $type, string $q)
    {
        $perPage = 15;
        switch ($type) {
            case 'students':
                $paginator = $this->searchStudents($q, null, $perPage);
                return $this->formatPaginated('students', $paginator);
            case 'applicants':
                $paginator = $this->searchApplicants($q, null, $perPage);
                return $this->formatPaginated('applicants', $paginator);
            case 'teachers':
                $paginator = $this->searchTeachers($q, null, $perPage);
                return $this->formatPaginated('teachers', $paginator);
            case 'subjects':
                $paginator = $this->searchSubjects($q, null, $perPage);
                return $this->formatPaginated('subjects', $paginator);
            case 'books':
                $paginator = $this->searchBooks($q, null, $perPage);
                return $this->formatPaginated('books', $paginator);
            case 'research':
                $paginator = $this->searchResearch($q, null, $perPage);
                return $this->formatPaginated('research', $paginator);
            case 'documents':
                $paginator = $this->searchDocuments($q, null, $perPage);
                return $this->formatPaginated('documents', $paginator);
            case 'attendance':
                $paginator = $this->searchAttendance($q, null, $perPage);
                return $this->formatPaginated('attendance', $paginator);
            case 'results':
                $paginator = $this->searchResults($q, null, $perPage);
                return $this->formatPaginated('results', $paginator);
            default:
                return [
                    'items' => [],
                    'total' => 0,
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $perPage,
                ];
        }
    }

    private function searchStudents(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = Student::with(['user', 'program']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('student_id_number', 'like', "%{$q}%")
                    ->orWhereHas('user', function ($uq) use ($q) {
                        $uq->where('name', 'like', "%{$q}%")
                           ->orWhere('email', 'like', "%{$q}%");
                    });
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function searchApplicants(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = Application::with(['applicant.user', 'program', 'academicYear']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->whereHas('applicant', function ($aq) use ($q) {
                    $aq->where('application_number', 'like', "%{$q}%")
                       ->orWhere('contact_number', 'like', "%{$q}%")
                       ->orWhereHas('user', function ($uq) use ($q) {
                           $uq->where('name', 'like', "%{$q}%")
                              ->orWhere('email', 'like', "%{$q}%");
                       });
                });
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function searchTeachers(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = Teacher::with(['user', 'department']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('specialization', 'like', "%{$q}%")
                    ->orWhereHas('user', function ($uq) use ($q) {
                        $uq->where('name', 'like', "%{$q}%")
                           ->orWhere('email', 'like', "%{$q}%");
                    });
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function searchSubjects(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = Subject::with(['department']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name_en', 'like', "%{$q}%")
                    ->orWhere('name_ar', 'like', "%{$q}%")
                    ->orWhere('code', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function searchBooks(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = Book::with(['category']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('author', 'like', "%{$q}%")
                    ->orWhere('isbn', 'like', "%{$q}%")
                    ->orWhere('call_number', 'like', "%{$q}%");
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function searchResearch(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = ResearchPaper::with(['user']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('abstract', 'like', "%{$q}%")
                    ->orWhere('keywords', 'like', "%{$q}%")
                    ->orWhere('category', 'like', "%{$q}%");
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function searchDocuments(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = Document::with(['user']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('file_name', 'like', "%{$q}%")
                    ->orWhereHas('user', function ($uq) use ($q) {
                        $uq->where('name', 'like', "%{$q}%");
                    });
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function searchAttendance(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = StudentAttendance::with(['student.user', 'course.subject']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('remarks', 'like', "%{$q}%")
                    ->orWhere('attendance_date', 'like', "%{$q}%")
                    ->orWhereHas('student.user', function ($uq) use ($q) {
                        $uq->where('name', 'like', "%{$q}%");
                    })
                    ->orWhereHas('course.subject', function ($sq) use ($q) {
                        $sq->where('name_en', 'like', "%{$q}%")
                           ->orWhere('name_ar', 'like', "%{$q}%")
                           ->orWhere('code', 'like', "%{$q}%");
                    });
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function searchResults(string $q, ?int $limit = null, ?int $perPage = null)
    {
        $query = ExamResult::with(['student.user', 'examination.course.subject']);
        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('remarks', 'like', "%{$q}%")
                    ->orWhereHas('student.user', function ($uq) use ($q) {
                        $uq->where('name', 'like', "%{$q}%");
                    })
                    ->orWhereHas('examination', function ($eq) use ($q) {
                        $eq->where('name', 'like', "%{$q}%");
                    });
            });
        }
        $query->orderBy('id', 'desc');

        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->limit($limit ?? 10)->get();
    }

    private function formatGrouped(string $type, $collection)
    {
        $formatted = $collection->map(function ($item) use ($type) {
            return $this->transformItem($type, $item);
        });

        $totalCount = $this->getTypeTotalCount($type);

        return [
            'items' => $formatted,
            'count' => $totalCount,
        ];
    }

    private function formatPaginated(string $type, $paginator)
    {
        $items = collect($paginator->items())->map(function ($item) use ($type) {
            return $this->transformItem($type, $item);
        });

        return [
            'items' => $items,
            'total' => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
        ];
    }

    private function getTypeTotalCount(string $type): int
    {
        switch ($type) {
            case 'students':
                return Student::count();
            case 'applicants':
                return Application::count();
            case 'teachers':
                return Teacher::count();
            case 'subjects':
                return Subject::count();
            case 'books':
                return Book::count();
            case 'research':
                return ResearchPaper::count();
            case 'documents':
                return Document::count();
            case 'attendance':
                return StudentAttendance::count();
            case 'results':
                return ExamResult::count();
            default:
                return 0;
        }
    }

    private function transformItem(string $type, $item)
    {
        switch ($type) {
            case 'students':
                return [
                    'id' => $item->id,
                    'title' => $item->user?->name ?? 'N/A',
                    'subtitle' => 'ID: ' . $item->student_id_number,
                    'meta' => $item->program?->name_en ?? 'General Track',
                    'detail' => $item->user?->email ?? '',
                ];
            case 'applicants':
                $statuses = [
                    1 => 'Draft',
                    2 => 'Submitted',
                    3 => 'Under Review',
                    4 => 'Interview',
                    5 => 'Selected',
                    6 => 'Rejected',
                    7 => 'Enrolled',
                ];
                return [
                    'id' => $item->id,
                    'title' => $item->applicant?->user?->name ?? 'Anonymous',
                    'subtitle' => 'Ref: ' . ($item->applicant?->application_number ?? 'N/A'),
                    'meta' => 'Status: ' . ($statuses[$item->status_id] ?? 'Unknown'),
                    'detail' => 'Track: ' . ($item->program?->name_en ?? 'General'),
                ];
            case 'teachers':
                return [
                    'id' => $item->id,
                    'title' => $item->user?->name ?? 'N/A',
                    'subtitle' => 'Specialization: ' . ($item->specialization ?? 'N/A'),
                    'meta' => $item->department?->name_en ?? 'General Department',
                    'detail' => $item->user?->email ?? '',
                ];
            case 'subjects':
                return [
                    'id' => $item->id,
                    'title' => $item->name_en . ' (' . $item->name_ar . ')',
                    'subtitle' => 'Code: ' . $item->code,
                    'meta' => 'Credits: ' . $item->credit_hours . ' Hours',
                    'detail' => $item->department?->name_en ?? '',
                ];
            case 'books':
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'subtitle' => 'Author: ' . $item->author,
                    'meta' => 'ISBN: ' . $item->isbn,
                    'detail' => 'Call No: ' . $item->call_number,
                ];
            case 'research':
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'subtitle' => 'Category: ' . $item->category,
                    'meta' => 'Author: ' . ($item->user?->name ?? 'N/A'),
                    'detail' => 'Status: ' . $item->status,
                ];
            case 'documents':
                return [
                    'id' => $item->id,
                    'title' => $item->file_name,
                    'subtitle' => 'Owner: ' . ($item->user?->name ?? 'System'),
                    'meta' => $item->mime_type,
                    'detail' => 'Uploaded: ' . ($item->created_at ? $item->created_at->format('Y-m-d') : ''),
                ];
            case 'attendance':
                $statuses = [1 => 'Present', 2 => 'Absent', 3 => 'Late', 4 => 'Excused'];
                return [
                    'id' => $item->id,
                    'title' => $item->student?->user?->name ?? 'N/A',
                    'subtitle' => 'Date: ' . ($item->attendance_date ? $item->attendance_date->format('Y-m-d') : 'N/A'),
                    'meta' => 'Status: ' . ($statuses[$item->status_id] ?? 'N/A'),
                    'detail' => 'Course: ' . ($item->course?->subject?->name_en ?? 'N/A'),
                ];
            case 'results':
                return [
                    'id' => $item->id,
                    'title' => $item->student?->user?->name ?? 'N/A',
                    'subtitle' => 'Exam: ' . ($item->examination?->name ?? 'N/A'),
                    'meta' => 'Marks: ' . $item->marks_obtained . '/' . ($item->examination?->max_marks ?? '100'),
                    'detail' => 'Remarks: ' . $item->remarks,
                ];
            default:
                return [];
        }
    }
}
