<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentTemplate extends Model
{
    use HasFactory;

    protected $table = 'document_templates';

    protected $fillable = [
        'name',
        'type',
        'html_content',
        'css_content',
        'qr_enabled',
        'signature_enabled',
        'signature_title',
    ];

    protected $casts = [
        'qr_enabled'        => 'boolean',
        'signature_enabled' => 'boolean',
    ];

    public function generatedDocuments(): HasMany
    {
        return $this->hasMany(GeneratedDocument::class);
    }
}
