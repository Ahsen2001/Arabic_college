<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Repositories\UserRepositoryInterface::class,
            \App\Repositories\Eloquent\UserRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::policy(
            \App\Models\User::class,
            \App\Policies\UserPolicy::class
        );

        // Register Spatie Permission Audit Event Listeners
        \Illuminate\Support\Facades\Event::listen(
            \Spatie\Permission\Events\RoleAttached::class,
            [\App\Listeners\AuditPermissionsListener::class, 'handle']
        );
        \Illuminate\Support\Facades\Event::listen(
            \Spatie\Permission\Events\RoleDetached::class,
            [\App\Listeners\AuditPermissionsListener::class, 'handle']
        );
        \Illuminate\Support\Facades\Event::listen(
            \Spatie\Permission\Events\PermissionAttached::class,
            [\App\Listeners\AuditPermissionsListener::class, 'handle']
        );
        \Illuminate\Support\Facades\Event::listen(
            \Spatie\Permission\Events\PermissionDetached::class,
            [\App\Listeners\AuditPermissionsListener::class, 'handle']
        );
    }
}
