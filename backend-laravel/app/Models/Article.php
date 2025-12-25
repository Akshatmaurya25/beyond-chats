<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Article extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'author',
        'published_date',
        'image_url',
        'source_url',
        'is_updated',
        'original_article_id',
        'references',
    ];

    protected $casts = [
        'published_date' => 'date',
        'is_updated' => 'boolean',
        'references' => 'array',
    ];

    public function originalArticle(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'original_article_id');
    }

    public function updatedVersion(): HasOne
    {
        return $this->hasOne(Article::class, 'original_article_id');
    }

    public function scopeOriginals($query)
    {
        return $query->where('is_updated', false);
    }

    public function scopeEnhanced($query)
    {
        return $query->where('is_updated', true);
    }
}
