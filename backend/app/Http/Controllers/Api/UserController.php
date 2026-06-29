<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController extends Controller implements HasMiddleware
{
    protected UserService $userService;

    /**
     * UserController constructor.
     *
     * @param UserService $userService
     */
    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Define the middleware that applies to this controller.
     */
    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $perPage = $request->query('per_page', 15);
        $users = $this->userService->getPaginated($perPage, ['*'], ['roles']);

        return ApiResponse::success(UserResource::collection($users)->response()->getData(true));
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreUserRequest $request
     * @return JsonResponse
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = $this->userService->create($request->validated());

        return ApiResponse::success(new UserResource($user), __('messages.auth.user_created'), 211);
    }

    /**
     * Display the specified resource.
     *
     * @param int|string $id
     * @return JsonResponse
     */
    public function show(int|string $id): JsonResponse
    {
        $user = $this->userService->findByIdOrFail($id, ['*'], ['roles', 'permissions']);

        $this->authorize('view', $user);

        return ApiResponse::success(new UserResource($user));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param Request $request
     * @param int|string $id
     * @return JsonResponse
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $user = $this->userService->findByIdOrFail($id);

        $this->authorize('update', $user);

        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', 'unique:users,email,' . $id],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'required', new \Illuminate\Validation\Rules\Enum(\App\Enums\UserRole::class)],
        ];

        $validatedData = $request->validate($rules);
        $updatedUser = $this->userService->update($id, $validatedData);

        return ApiResponse::success(new UserResource($updatedUser), __('messages.auth.user_updated'));
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param int|string $id
     * @return JsonResponse
     */
    public function destroy(int|string $id): JsonResponse
    {
        $user = $this->userService->findByIdOrFail($id);

        $this->authorize('delete', $user);

        $this->userService->delete($id);

        return ApiResponse::success(null, __('messages.auth.user_deleted'));
    }
}
