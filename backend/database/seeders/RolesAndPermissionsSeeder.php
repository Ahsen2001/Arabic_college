<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Create Permissions
        $permissions = [
            // User management
            'view users', 'create users', 'edit users', 'delete users',
            // Academic administration
            'manage departments', 'manage programs', 'manage subjects', 'manage courses',
            // Academic operations
            'view academic records', 'edit academic records',
            'mark student attendance', 'view student attendance',
            'grade examinations', 'view exam results',
            // Research
            'manage research', 'view research',
            // Library
            'manage catalog', 'issue books', 'view library logs',
            // Finance
            'manage invoices', 'view financial records', 'manage financial transactions',
            // Admissions
            'view applications', 'process applications',
            // General utilities
            'manage settings', 'manage backups', 'view audit logs'
        ];

        foreach ($permissions as $permissionName) {
            Permission::findOrCreate($permissionName, 'web');
        }

        // 2. Create Roles and Assign Permissions
        
        // Super Admin (has all permissions)
        $superAdmin = Role::findOrCreate('Super Admin', 'web');
        $superAdmin->givePermissionTo(Permission::all());

        // Registrar (manages students, applications, programs)
        $registrar = Role::findOrCreate('Registrar', 'web');
        $registrar->givePermissionTo([
            'view users', 'create users', 'edit users',
            'manage programs', 'view academic records',
            'view applications', 'process applications'
        ]);

        // Accountant (manages fees, invoices, payments)
        $accountant = Role::findOrCreate('Accountant', 'web');
        $accountant->givePermissionTo([
            'view users', 'manage invoices', 'view financial records', 'manage financial transactions'
        ]);

        // Librarian (manages catalog, book borrowing)
        $librarian = Role::findOrCreate('Librarian', 'web');
        $librarian->givePermissionTo([
            'view users', 'manage catalog', 'issue books', 'view library logs'
        ]);

        // Teacher (teaches courses, grades exams, registers attendance)
        $teacher = Role::findOrCreate('Teacher', 'web');
        $teacher->givePermissionTo([
            'view users', 'view academic records',
            'mark student attendance', 'view student attendance',
            'grade examinations', 'view exam results',
            'view research'
        ]);

        // Student (views grades, invoices, registers for courses)
        $student = Role::findOrCreate('Student', 'web');
        $student->givePermissionTo([
            'view student attendance', 'view exam results', 'view financial records'
        ]);

        // Applicant (views admission status, uploads documents)
        $applicant = Role::findOrCreate('Applicant', 'web');
        $applicant->givePermissionTo([
            'view applications'
        ]);
    }
}
