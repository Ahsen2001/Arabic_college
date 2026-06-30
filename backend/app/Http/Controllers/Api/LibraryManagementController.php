<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCategory;
use App\Models\LibraryBorrow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LibraryManagementController extends Controller
{
    // =========================================================================
    // LOOKUPS
    // =========================================================================

    public function getLookups(): JsonResponse
    {
        return ApiResponse::success([
            'categories' => BookCategory::orderBy('name')->get(),
            'statuses'   => DB::table('borrow_statuses')->get(),
        ], 'Library lookups loaded.');
    }

    // =========================================================================
    // BOOK CATALOGUE
    // =========================================================================

    public function getBooks(Request $request): JsonResponse
    {
        $query = Book::with('category');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('authors', 'like', "%{$search}%")
                  ->orWhere('publisher', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $books = $query->orderBy('title')->paginate(20);
        return ApiResponse::success($books, 'Books catalog loaded.');
    }

    public function storeBook(Request $request): JsonResponse
    {
        $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'authors'          => ['required', 'string', 'max:255'],
            'category_id'      => ['required', 'integer', 'exists:book_categories,id'],
            'publisher'        => ['nullable', 'string', 'max:255'],
            'isbn'             => ['nullable', 'string', 'max:50', 'unique:books,isbn'],
            'barcode'          => ['nullable', 'string', 'max:100', 'unique:books,barcode'],
            'publication_year' => ['nullable', 'integer', 'min:1000', 'max:' . (date('Y') + 1)],
            'total_copies'     => ['required', 'integer', 'min:1'],
            'shelf_location'   => ['nullable', 'string', 'max:100'],
        ]);

        $book = Book::create([
            'title'            => $request->title,
            'authors'          => $request->authors,
            'category_id'      => $request->category_id,
            'publisher'        => $request->publisher,
            'isbn'             => $request->isbn,
            'barcode'          => $request->barcode,
            'publication_year' => $request->publication_year,
            'total_copies'     => $request->total_copies,
            'available_copies' => $request->total_copies, // initially fully available
            'shelf_location'   => $request->shelf_location,
        ]);

        return ApiResponse::success($book->load('category'), 'Book registered successfully.');
    }

    public function updateBook(Request $request, $id): JsonResponse
    {
        $book = Book::findOrFail($id);

        $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'authors'          => ['required', 'string', 'max:255'],
            'category_id'      => ['required', 'integer', 'exists:book_categories,id'],
            'publisher'        => ['nullable', 'string', 'max:255'],
            'isbn'             => ['nullable', 'string', 'max:50', 'unique:books,isbn,' . $id],
            'barcode'          => ['nullable', 'string', 'max:100', 'unique:books,barcode,' . $id],
            'publication_year' => ['nullable', 'integer', 'min:1000', 'max:' . (date('Y') + 1)],
            'total_copies'     => ['required', 'integer', 'min:' . ($book->total_copies - $book->available_copies)],
            'shelf_location'   => ['nullable', 'string', 'max:100'],
        ]);

        // Adjust available copies based on new total
        $diff = $request->total_copies - $book->total_copies;
        $newAvailable = $book->available_copies + $diff;

        $book->update([
            'title'            => $request->title,
            'authors'          => $request->authors,
            'category_id'      => $request->category_id,
            'publisher'        => $request->publisher,
            'isbn'             => $request->isbn,
            'barcode'          => $request->barcode,
            'publication_year' => $request->publication_year,
            'total_copies'     => $request->total_copies,
            'available_copies' => $newAvailable,
            'shelf_location'   => $request->shelf_location,
        ]);

        return ApiResponse::success($book->load('category'), 'Book details updated.');
    }

    public function deleteBook($id): JsonResponse
    {
        $book = Book::findOrFail($id);
        
        // Prevent deleting if copy is checked out
        if ($book->available_copies < $book->total_copies) {
            return ApiResponse::error('Cannot delete book while copies are checked out.', 409);
        }

        $book->delete();
        return ApiResponse::success(null, 'Book removed from catalog.');
    }

    // =========================================================================
    // BORROW / RETURN ACTIONS
    // =========================================================================

    public function borrowBook(Request $request): JsonResponse
    {
        $request->validate([
            'book_id'            => ['required_without:barcode', 'nullable', 'integer', 'exists:books,id'],
            'barcode'            => ['required_without:book_id', 'nullable', 'string'],
            'student_id_number'  => ['required', 'string'],
            'duration_days'      => ['required', 'integer', 'min:1', 'max:60'],
        ]);

        // Find Book by ID or Barcode
        $book = null;
        if ($request->filled('book_id')) {
            $book = Book::find($request->book_id);
        } elseif ($request->filled('barcode')) {
            $book = Book::where('barcode', $request->barcode)->first();
        }

        if (!$book) {
            return ApiResponse::error('Book not found in library.', 404);
        }

        if ($book->available_copies <= 0) {
            return ApiResponse::error('No physical copies of this book are available.', 409);
        }

        // Find User by student ID number
        $studentUser = User::whereHas('student', function ($q) use ($request) {
            $q->where('student_id_number', $request->student_id_number);
        })->first();

        if (!$studentUser) {
            return ApiResponse::error('Student not found with specified registration ID.', 404);
        }

        // Check if student has already borrowed this book and not returned
        $alreadyBorrowed = LibraryBorrow::where('book_id', $book->id)
            ->where('user_id', $studentUser->id)
            ->where('status_id', 1) // Issued
            ->exists();

        if ($alreadyBorrowed) {
            return ApiResponse::error('This student has already checked out a copy of this book.', 409);
        }

        DB::beginTransaction();
        try {
            // Create borrow transaction
            $borrow = LibraryBorrow::create([
                'book_id'            => $book->id,
                'user_id'            => $studentUser->id,
                'borrow_date'        => now()->toDateString(),
                'due_date'           => now()->addDays($request->duration_days)->toDateString(),
                'status_id'          => 1, // Issued
                'fine_amount'        => 0.00,
                'issued_by_staff_id' => null, // filled in context of logged in user
            ]);

            // Decrement copies
            $book->decrement('available_copies');

            DB::commit();
            return ApiResponse::success($borrow->load(['book', 'user']), 'Book borrowed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Borrow transaction failed: ' . $e->getMessage(), 500);
        }
    }

    public function returnBook(Request $request): JsonResponse
    {
        $request->validate([
            'borrow_id'   => ['required_without:barcode', 'nullable', 'integer', 'exists:library_borrows,id'],
            'barcode'     => ['required_without:borrow_id', 'nullable', 'string'],
            'status'      => ['required', 'string', 'in:Returned,Lost'],
            'custom_fine' => ['nullable', 'numeric', 'min:0'],
        ]);

        $borrow = null;
        if ($request->filled('borrow_id')) {
            $borrow = LibraryBorrow::with('book')->find($request->borrow_id);
        } elseif ($request->filled('barcode')) {
            // Find issued borrow log by book barcode
            $book = Book::where('barcode', $request->barcode)->first();
            if ($book) {
                $borrow = LibraryBorrow::with('book')
                    ->where('book_id', $book->id)
                    ->where('status_id', 1) // Issued
                    ->orderBy('borrow_date', 'desc')
                    ->first();
            }
        }

        if (!$borrow || $borrow->status_id != 1) {
            return ApiResponse::error('Active borrowing transaction not found for this book.', 404);
        }

        DB::beginTransaction();
        try {
            $dueDate = Carbon::parse($borrow->due_date);
            $today   = Carbon::today();
            $fine    = 0.00;

            // Late fine rule: 50 PKR per day overdue
            if ($today->gt($dueDate)) {
                $overdueDays = $today->diffInDays($dueDate);
                $fine = $overdueDays * 50;
            }

            if ($request->filled('custom_fine')) {
                $fine = $request->custom_fine;
            }

            $newStatusId = $request->status === 'Lost' ? 4 : 2; // Lost (4) or Returned (2)

            $borrow->update([
                'return_date' => now()->toDateString(),
                'status_id'   => $newStatusId,
                'fine_amount' => $fine,
            ]);

            // Adjust copies (if Returned, increment available_copies. If Lost, decrement total_copies)
            if ($newStatusId === 2) {
                $borrow->book->increment('available_copies');
            } elseif ($newStatusId === 4) {
                $borrow->book->decrement('total_copies');
            }

            DB::commit();
            return ApiResponse::success([
                'borrow' => $borrow->load(['book', 'user', 'status']),
                'fine'   => $fine,
                'status' => $request->status,
            ], 'Book return processed.');
        } catch (\Exception $e) {
            DB::rollBack();
            return ApiResponse::error('Return process failed: ' . $e->getMessage(), 500);
        }
    }

    public function getActiveBorrows(Request $request): JsonResponse
    {
        $query = LibraryBorrow::with(['book.category', 'user.student', 'status'])
            ->orderBy('due_date', 'asc');

        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        } else {
            $query->whereIn('status_id', [1, 3]); // Issued or Overdue
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhereHas('book', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        $borrows = $query->paginate(25);
        return ApiResponse::success($borrows, 'Borrowing log loaded.');
    }

    // =========================================================================
    // CATEGORIES
    // =========================================================================

    public function storeCategory(Request $request): JsonResponse
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:255', 'unique:book_categories,name'],
            'code'        => ['required', 'string', 'max:20', 'unique:book_categories,code'],
            'description' => ['nullable', 'string'],
        ]);

        $cat = BookCategory::create($request->all());
        return ApiResponse::success($cat, 'Book category registered.');
    }

    // =========================================================================
    // ANALYTICS / REPORTS
    // =========================================================================

    public function getAnalytics(): JsonResponse
    {
        $totalBooks       = Book::sum('total_copies');
        $availableCopies  = Book::sum('available_copies');
        $borrowedCopies   = max(0, $totalBooks - $availableCopies);
        
        $overdueCount = LibraryBorrow::whereIn('status_id', [1, 3])
            ->where('due_date', '<', now()->toDateString())
            ->count();

        $totalFines = LibraryBorrow::sum('fine_amount');

        // Books by category breakdown
        $categoryBreakdown = DB::table('books')
            ->join('book_categories', 'books.category_id', '=', 'book_categories.id')
            ->whereNull('books.deleted_at')
            ->select('book_categories.name', DB::raw('SUM(books.total_copies) as total_copies'))
            ->groupBy('book_categories.name')
            ->get();

        // Monthly borrowing trends
        $monthlyBorrowing = DB::table('library_borrows')
            ->selectRaw('DATE_FORMAT(borrow_date, "%Y-%m") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(6)
            ->get();

        // Popular Books
        $popularBooks = DB::table('library_borrows')
            ->join('books', 'library_borrows.book_id', '=', 'books.id')
            ->select('books.title', 'books.authors', DB::raw('COUNT(library_borrows.id) as borrow_count'))
            ->groupBy('books.id', 'books.title', 'books.authors')
            ->orderByDesc('borrow_count')
            ->limit(5)
            ->get();

        return ApiResponse::success([
            'totals' => [
                'total_books'      => (int) $totalBooks,
                'borrowed_copies'  => (int) $borrowedCopies,
                'available_copies' => (int) $availableCopies,
                'overdue_count'    => (int) $overdueCount,
                'total_fines'      => (float) $totalFines,
            ],
            'category_breakdown' => $categoryBreakdown,
            'monthly_borrowing'  => $monthlyBorrowing,
            'popular_books'      => $popularBooks,
        ], 'Library analytics loaded.');
    }
}
