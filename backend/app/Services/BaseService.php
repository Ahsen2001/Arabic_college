<?php

namespace App\Services;

use App\Repositories\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class BaseService
{
    /**
     * The repository instance.
     *
     * @var BaseRepositoryInterface
     */
    protected BaseRepositoryInterface $repository;

    /**
     * BaseService constructor.
     *
     * @param BaseRepositoryInterface $repository
     */
    public function __construct(BaseRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get all records.
     *
     * @param array $columns
     * @param array $relations
     * @return Collection
     */
    public function getAll(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->repository->all($columns, $relations);
    }

    /**
     * Get paginated records.
     *
     * @param int $perPage
     * @param array $columns
     * @param array $relations
     * @return LengthAwarePaginator
     */
    public function getPaginated(int $perPage = 15, array $columns = ['*'], array $relations = []): LengthAwarePaginator
    {
        return $this->repository->paginate($perPage, $columns, $relations);
    }

    /**
     * Find a record by ID.
     *
     * @param int|string $id
     * @param array $columns
     * @param array $relations
     * @return Model|null
     */
    public function findById(int|string $id, array $columns = ['*'], array $relations = []): ?Model
    {
        return $this->repository->find($id, $columns, $relations);
    }

    /**
     * Find a record by ID or throw exception.
     *
     * @param int|string $id
     * @param array $columns
     * @param array $relations
     * @return Model
     */
    public function findByIdOrFail(int|string $id, array $columns = ['*'], array $relations = []): Model
    {
        return $this->repository->findOrFail($id, $columns, $relations);
    }

    /**
     * Create a new record.
     *
     * @param array $data
     * @return Model
     */
    public function create(array $data): Model
    {
        return $this->repository->create($data);
    }

    /**
     * Update a record.
     *
     * @param int|string $id
     * @param array $data
     * @return Model
     */
    public function update(int|string $id, array $data): Model
    {
        return $this->repository->update($id, $data);
    }

    /**
     * Delete a record.
     *
     * @param int|string $id
     * @return bool
     */
    public function delete(int|string $id): bool
    {
        return $this->repository->delete($id);
    }
}
