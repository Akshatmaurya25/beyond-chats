import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function scrapeArticleContent(url) {
  console.log(`Scraping article from: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('script, style, nav, header, footer, aside, .advertisement, .sidebar, .comments, .social-share').remove();

    let title = '';
    let content = '';

    title = $('h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            $('title').text().trim();

    const articleSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main',
      '.blog-post',
      '.post-body'
    ];

    for (const selector of articleSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 200) {
        content = cleanContent(element.html());
        break;
      }
    }

    if (!content) {
      const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
      content = paragraphs.filter(p => p.length > 50).join('\n\n');
    }

    console.log(`Scraped article: "${title}" (${content.length} chars)`);

    return {
      title,
      content: content || 'Content could not be extracted',
      url
    };

  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error.message);
    return {
      title: 'Unknown',
      content: 'Failed to extract content',
      url
    };
  }
}

function cleanContent(html) {
  if (!html) return '';

  const $ = cheerio.load(html);

  $('script, style, nav, aside, .advertisement').remove();

  let text = $.text()
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  return text;
}

export default { scrapeArticleContent };
