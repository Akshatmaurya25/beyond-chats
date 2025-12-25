import 'dotenv/config';
import { getLatestOriginalArticle, createArticle } from './services/laravelApi.js';
import { searchGoogle } from './services/googleSearch.js';
import { scrapeArticleContent } from './services/scraper.js';
import { initGemini, rewriteArticle } from './services/gemini.js';

async function main() {
  console.log('='.repeat(60));
  console.log('BeyondChats Article Processor');
  console.log('='.repeat(60));

  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set in .env file');
    process.exit(1);
  }

  initGemini(process.env.GEMINI_API_KEY);

  try {
    console.log('\n[Step 1] Fetching latest original article from Laravel API...');
    const latestArticle = await getLatestOriginalArticle();

    if (!latestArticle || !latestArticle.data) {
      console.error('No articles found in the database. Run the Laravel scraper first.');
      process.exit(1);
    }

    const article = latestArticle.data;
    console.log(`Found article: "${article.title}"`);

    console.log('\n[Step 2] Searching Google for similar articles...');
    const searchResults = await searchGoogle(article.title, 2);

    if (searchResults.length === 0) {
      console.error('No search results found. Cannot proceed without reference articles.');
      process.exit(1);
    }

    console.log(`Found ${searchResults.length} reference articles:`);
    searchResults.forEach((r, i) => console.log(`  ${i + 1}. ${r.title} - ${r.url}`));

    console.log('\n[Step 3] Scraping reference article content...');
    const referenceArticles = [];
    for (const result of searchResults) {
      const scraped = await scrapeArticleContent(result.url);
      if (scraped.content && scraped.content.length > 100) {
        referenceArticles.push(scraped);
      }
    }

    if (referenceArticles.length === 0) {
      console.error('Failed to scrape any reference articles.');
      process.exit(1);
    }

    console.log('\n[Step 4] Rewriting article using Gemini AI...');
    const rewrittenContent = await rewriteArticle(
      { title: article.title, content: article.content },
      referenceArticles
    );

    const citationsHtml = buildCitations(referenceArticles);
    const finalContent = rewrittenContent + citationsHtml;

    console.log('\n[Step 5] Publishing updated article to Laravel API...');
    const newArticle = await createArticle({
      title: `${article.title} (Enhanced)`,
      slug: `${article.slug}-enhanced-${Date.now()}`,
      content: finalContent,
      excerpt: article.excerpt,
      author: article.author,
      image_url: article.image_url,
      source_url: article.source_url,
      is_updated: true,
      original_article_id: article.id,
      references: JSON.stringify(referenceArticles.map(r => ({
        title: r.title,
        url: r.url
      })))
    });

    console.log('\n' + '='.repeat(60));
    console.log('SUCCESS! Article has been processed and published.');
    console.log(`New article ID: ${newArticle.data?.id || 'N/A'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\nERROR:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

function buildCitations(references) {
  if (!references || references.length === 0) return '';

  const citationsList = references.map(ref =>
    `<li><a href="${ref.url}" target="_blank" rel="noopener noreferrer">${ref.title}</a></li>`
  ).join('\n');

  return `
<hr>
<h3>References</h3>
<p>This article was enhanced using insights from the following sources:</p>
<ul>
${citationsList}
</ul>
`;
}

main();
