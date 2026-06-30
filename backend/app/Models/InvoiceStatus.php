<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class InvoiceStatus extends Model { protected $table = 'invoice_statuses'; protected $primaryKey = 'id'; public $incrementing = false; }
