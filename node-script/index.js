import 'dotenv/config';
import { getAllArticles, createArticle } from './services/laravelApi.js';
import { searchGoogle } from './services/googleSearch.js';
import { scrapeArticleContent } from './services/scraper.js';
import { initGemini, rewriteArticle } from './services/gemini.js';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processArticle(article, index, total) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Processing article ${index + 1}/${total}: "${article.title}"`);
  console.log('─'.repeat(60));

  try {
    // Step 1: Try to search for similar articles
    console.log('\n[Step 1] Searching for similar articles...');
    let referenceArticles = [];

    try {
      const searchResults = await searchGoogle(article.title, 2);

      if (searchResults.length > 0) {
        console.log(`Found ${searchResults.length} reference articles:`);
        searchResults.forEach((r, i) => console.log(`  ${i + 1}. ${r.title}`));

        // Step 2: Scrape reference articles
        console.log('\n[Step 2] Scraping reference article content...');
        for (const result of searchResults) {
          const scraped = await scrapeArticleContent(result.url);
          if (scraped.content && scraped.content.length > 100) {
            referenceArticles.push(scraped);
          }
        }
      }
    } catch (searchError) {
      console.log(`⚠ Search failed: ${searchError.message}`);
    }

    if (referenceArticles.length === 0) {
      console.log('ℹ No reference articles available. Will enhance using AI knowledge only.');
    } else {
      console.log(`✓ Got ${referenceArticles.length} reference article(s) for context.`);
    }

    // Step 3: Rewrite with Gemini AI (with or without references)
    console.log('\n[Step 3] Enhancing article using Gemini AI...');
    const rewrittenContent = await rewriteArticle(
      { title: article.title, content: article.content },
      referenceArticles
    );

    const citationsHtml = referenceArticles.length > 0 ? buildCitations(referenceArticles) : '';
    const finalContent = rewrittenContent + citationsHtml;

    // Step 4: Publish to Laravel API
    console.log('\n[Step 4] Publishing enhanced article...');
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

    console.log(`✓ SUCCESS! Enhanced article created with ID: ${newArticle.data?.id || 'N/A'}`);
    return { success: true, newId: newArticle.data?.id };

  } catch (error) {
    console.error(`✗ ERROR processing article: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('BeyondChats Article Processor - Batch Mode');
  console.log('='.repeat(60));

  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set in .env file');
    process.exit(1);
  }

  initGemini(process.env.GEMINI_API_KEY);

  try {
    // Get all articles
    console.log('\nFetching all articles from Laravel API...');
    const response = await getAllArticles();
    const allArticles = response.data || [];

    console.log(`Total articles in database: ${allArticles.length}`);

    // Filter: only original articles (is_updated = false)
    const originalArticles = allArticles.filter(a => !a.is_updated);
    console.log(`Original articles: ${originalArticles.length}`);

    // Find which original articles already have enhanced versions
    const enhancedOriginalIds = allArticles
      .filter(a => a.is_updated && a.original_article_id)
      .map(a => a.original_article_id);

    // Filter: original articles that DON'T have enhanced versions yet
    const articlesToProcess = originalArticles.filter(
      a => !enhancedOriginalIds.includes(a.id)
    );

    console.log(`Articles needing enhancement: ${articlesToProcess.length}`);

    if (articlesToProcess.length === 0) {
      console.log('\n✓ All articles have already been enhanced!');
      process.exit(0);
    }

    // Process each article
    const results = [];
    for (let i = 0; i < articlesToProcess.length; i++) {
      const article = articlesToProcess[i];
      const result = await processArticle(article, i, articlesToProcess.length);
      results.push({ title: article.title, ...result });

      // Wait between articles to avoid rate limits (30 seconds)
      if (i < articlesToProcess.length - 1) {
        console.log('\n⏳ Waiting 30 seconds before next article (rate limit protection)...');
        await delay(30000);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('BATCH PROCESSING COMPLETE');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed articles:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - "${r.title}": ${r.reason}`);
      });
    }

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
