<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions
        $permissions = [
            'view-users',
            'create-users',
            'edit-users',
            'delete-users',
            'view-courses',
            'manage-courses',
            'view-students',
            'manage-students',
            'view-reports',
            'export-reports',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // Create roles and assign existing permissions
        $adminRole = Role::findOrCreate(UserRole::ADMIN->value, 'web');
        $adminRole->givePermissionTo(Permission::all());

        Role::findOrCreate(UserRole::ACADEMIC_REGISTRY->value, 'web')
            ->givePermissionTo([
                'view-courses',
                'manage-courses',
                'view-students',
                'manage-students',
                'view-reports',
            ]);

        Role::findOrCreate(UserRole::TEACHER->value, 'web')
            ->givePermissionTo([
                'view-courses',
                'view-students',
                'view-reports',
            ]);

        Role::findOrCreate(UserRole::STUDENT->value, 'web')
            ->givePermissionTo([
                'view-courses',
            ]);

        Role::findOrCreate(UserRole::PARENT->value, 'web');
        Role::findOrCreate(UserRole::ACCOUNTANT->value, 'web');

        // Create Default Admin User
        $adminEmail = 'admin@acms.edu';
        $adminUser = User::where('email', $adminEmail)->first();

        if (!$adminUser) {
            $adminUser = User::create([
                'name' => 'مدير النظام العربي',
                'email' => $adminEmail,
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]);

            $adminUser->assignRole(UserRole::ADMIN->value);
        }
    }
}
