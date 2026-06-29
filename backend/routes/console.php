<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Illuminate\Foundation\Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule Spatie Permission model cache clearing and personal access tokens cleaning
Schedule::command('sanctum:prune-expired --hours=24')->daily();
Schedule::call(function () {
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
})->dailyAt('00:00');
