<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content');
            $table->text('excerpt')->nullable();
            $table->string('author')->nullable();
            $table->date('published_date')->nullable();
            $table->string('image_url')->nullable();
            $table->string('source_url');
            $table->boolean('is_updated')->default(false);
            $table->foreignId('original_article_id')->nullable()->constrained('articles')->onDelete('set null');
            $table->json('references')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
