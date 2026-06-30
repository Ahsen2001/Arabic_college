<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BorrowStatus extends Model
{
    protected $table = 'borrow_statuses';

    protected $fillable = [
        'name',
        'description',
    ];
}
