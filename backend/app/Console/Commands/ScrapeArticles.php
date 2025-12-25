<?php

namespace App\Console\Commands;

use App\Models\Article;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use DOMDocument;
use DOMXPath;

class ScrapeArticles extends Command
{
    protected $signature = 'scrape:articles {--page=15 : The page number to scrape} {--count=5 : Number of articles to scrape}';
    protected $description = 'Scrape articles from BeyondChats blog';

    public function handle(): int
    {
        $pageNum = $this->option('page');
        $count = $this->option('count');

        $this->info("Scraping articles from BeyondChats blog page {$pageNum}...");

        $url = "https://beyondchats.com/blogs/page/{$pageNum}/";

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ])->get($url);

            if (!$response->successful()) {
                $this->error("Failed to fetch page: HTTP {$response->status()}");
                return 1;
            }

            $html = $response->body();
            $articles = $this->parseArticleList($html);

            if (empty($articles)) {
                $this->warn("No articles found on page {$pageNum}");
                return 1;
            }

            $articles = array_slice($articles, 0, $count);
            $this->info("Found " . count($articles) . " articles to process");

            $bar = $this->output->createProgressBar(count($articles));
            $bar->start();

            foreach ($articles as $articleData) {
                $this->processArticle($articleData);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Scraping completed successfully!");

            return 0;

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            return 1;
        }
    }

    private function parseArticleList(string $html): array
    {
        $articles = [];

        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($html, LIBXML_NOERROR);
        $xpath = new DOMXPath($dom);

        $articleElements = $xpath->query("//article | //div[contains(@class, 'post')] | //div[contains(@class, 'blog-item')]");

        foreach ($articleElements as $element) {
            $titleNode = $xpath->query(".//h2/a | .//h3/a | .//a[contains(@class, 'entry-title')]", $element)->item(0);
            $imageNode = $xpath->query(".//img", $element)->item(0);
            $excerptNode = $xpath->query(".//p | .//div[contains(@class, 'excerpt')]", $element)->item(0);
            $authorNode = $xpath->query(".//*[contains(@class, 'author')] | .//a[contains(@rel, 'author')]", $element)->item(0);
            $dateNode = $xpath->query(".//*[contains(@class, 'date')] | .//time", $element)->item(0);

            if ($titleNode) {
                $articles[] = [
                    'title' => trim($titleNode->textContent),
                    'url' => $titleNode->getAttribute('href'),
                    'image_url' => $imageNode ? $imageNode->getAttribute('src') : null,
                    'excerpt' => $excerptNode ? trim(substr($excerptNode->textContent, 0, 300)) : null,
                    'author' => $authorNode ? trim($authorNode->textContent) : null,
                    'date' => $dateNode ? trim($dateNode->textContent) : null,
                ];
            }
        }

        return $articles;
    }

    private function processArticle(array $data): void
    {
        $existingArticle = Article::where('source_url', $data['url'])->first();

        if ($existingArticle) {
            $this->line(" Skipping (already exists): {$data['title']}");
            return;
        }

        $fullContent = $this->fetchArticleContent($data['url']);

        $publishedDate = null;
        if (!empty($data['date'])) {
            try {
                $publishedDate = \Carbon\Carbon::parse($data['date'])->format('Y-m-d');
            } catch (\Exception $e) {
                // Ignore date parsing errors
            }
        }

        Article::create([
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'content' => $fullContent,
            'excerpt' => $data['excerpt'],
            'author' => $data['author'],
            'published_date' => $publishedDate,
            'image_url' => $data['image_url'],
            'source_url' => $data['url'],
            'is_updated' => false,
        ]);
    }

    private function fetchArticleContent(string $url): string
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ])->get($url);

            if (!$response->successful()) {
                return 'Content could not be fetched.';
            }

            $html = $response->body();
            return $this->extractMainContent($html);

        } catch (\Exception $e) {
            return 'Content could not be fetched: ' . $e->getMessage();
        }
    }

    private function extractMainContent(string $html): string
    {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NOERROR);
        $xpath = new DOMXPath($dom);

        // Remove unwanted elements
        $unwanted = $xpath->query("//script | //style | //nav | //header | //footer | //aside | //form");
        foreach ($unwanted as $node) {
            $node->parentNode->removeChild($node);
        }

        // Try to find main content (BeyondChats specific selectors first)
        $contentSelectors = [
            "//*[contains(@class, 'has-content-area')]",
            "//*[contains(@class, 'elementor-widget-theme-post-content')]",
            "//article//*[contains(@class, 'elementor-widget-container')]",
            "//article",
            "//*[contains(@class, 'post-content')]",
            "//*[contains(@class, 'entry-content')]",
            "//*[contains(@class, 'article-content')]",
            "//main",
            "//*[@role='main']",
        ];

        // First try: get all paragraphs (works better for JS-rendered sites)
        $paragraphs = $xpath->query("//p");
        $text = '';
        foreach ($paragraphs as $p) {
            $pText = trim($p->textContent);
            if (strlen($pText) > 30) {
                $text .= "<p>{$pText}</p>\n";
            }
        }

        // Also get headings
        $headings = $xpath->query("//h2 | //h3");
        $headingText = '';
        foreach ($headings as $h) {
            $hText = trim($h->textContent);
            if (strlen($hText) > 5 && strlen($hText) < 200) {
                $tag = $h->nodeName;
                $headingText .= "<{$tag}>{$hText}</{$tag}>\n";
            }
        }

        if (strlen($text) > 500) {
            return $headingText . $text;
        }

        // Fallback: try content selectors
        foreach ($contentSelectors as $selector) {
            $content = $xpath->query($selector)->item(0);
            if ($content) {
                $extracted = $this->cleanHtml($dom->saveHTML($content));
                if (strlen($extracted) > 500) {
                    return $extracted;
                }
            }
        }

        return $text ?: 'Content could not be extracted.';
    }

    private function cleanHtml(string $html): string
    {
        // Remove inline scripts and styles
        $html = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $html);
        $html = preg_replace('/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/mi', '', $html);

        // Clean up whitespace
        $html = preg_replace('/\s+/', ' ', $html);
        $html = preg_replace('/>\s+</', '><', $html);

        return trim($html);
    }
}
