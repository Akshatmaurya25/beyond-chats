<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ArticleController extends Controller
{
    public function index(): JsonResponse
    {
        $articles = Article::orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $articles]);
    }

    public function show(int $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        return response()->json(['data' => $article]);
    }

    public function latest(): JsonResponse
    {
        $article = Article::where('is_updated', false)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$article) {
            return response()->json(['error' => 'No original articles found'], 404);
        }

        return response()->json(['data' => $article]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'slug' => 'nullable|string|max:500',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'published_date' => 'nullable|date',
            'image_url' => 'nullable|string|max:1000',
            'source_url' => 'required|string|max:1000',
            'is_updated' => 'nullable|boolean',
            'original_article_id' => 'nullable|exists:articles,id',
            'references' => 'nullable',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . time();
        }

        $article = Article::create($validated);

        return response()->json(['data' => $article], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $article = Article::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:500',
            'slug' => 'sometimes|string|max:500',
            'content' => 'sometimes|string',
            'excerpt' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'published_date' => 'nullable|date',
            'image_url' => 'nullable|string|max:1000',
            'source_url' => 'sometimes|string|max:1000',
            'is_updated' => 'nullable|boolean',
            'original_article_id' => 'nullable|exists:articles,id',
            'references' => 'nullable',
        ]);

        $article->update($validated);

        return response()->json(['data' => $article]);
    }

    public function destroy(int $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $article->delete();

        return response()->json(['message' => 'Article deleted successfully']);
    }
}
