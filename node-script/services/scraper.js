import puppeteer from 'puppeteer';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function scrapeArticleContent(url) {
  console.log(`Scraping article from: ${url}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();

    // Stealth settings
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Override webdriver detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Navigate with longer timeout
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    // Wait for content to load
    await delay(3000);

    // Scroll to load lazy content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await delay(1000);

    // Extract content using browser
    const result = await page.evaluate(() => {
      // Remove unwanted elements
      const unwanted = document.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .sidebar, .comments, .social-share, .cookie-banner, .popup, .modal');
      unwanted.forEach(el => el.remove());

      // Get title
      let title = '';
      const h1 = document.querySelector('h1');
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const titleTag = document.querySelector('title');

      if (h1) title = h1.textContent.trim();
      else if (ogTitle) title = ogTitle.getAttribute('content');
      else if (titleTag) title = titleTag.textContent.trim();

      // Get content from multiple selectors
      const articleSelectors = [
        'article',
        '[role="main"]',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.blog-content',
        '.content-area',
        'main',
        '.blog-post',
        '.post-body',
        '#content',
        '.prose'
      ];

      let content = '';

      for (const selector of articleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 300) {
          content = element.textContent.trim();
          break;
        }
      }

      // Fallback: collect all paragraphs
      if (!content || content.length < 300) {
        const paragraphs = [];
        document.querySelectorAll('p').forEach(p => {
          const text = p.textContent.trim();
          if (text.length > 40) {
            paragraphs.push(text);
          }
        });
        content = paragraphs.join('\n\n');
      }

      // Also get headings for structure
      const headings = [];
      document.querySelectorAll('h2, h3').forEach(h => {
        const text = h.textContent.trim();
        if (text.length > 3 && text.length < 200) {
          headings.push(text);
        }
      });

      return { title, content, headings };
    });

    // Clean up content
    let cleanedContent = result.content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    // Add headings if content is short
    if (result.headings.length > 0 && cleanedContent.length < 500) {
      cleanedContent = result.headings.join('\n') + '\n\n' + cleanedContent;
    }

    console.log(`Scraped article: "${result.title}" (${cleanedContent.length} chars)`);

    return {
      title: result.title || 'Unknown',
      content: cleanedContent || 'Content could not be extracted',
      url
    };

  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error.message);
    return {
      title: 'Unknown',
      content: 'Failed to extract content',
      url
    };
  } finally {
    await browser.close();
  }
}

export default { scrapeArticleContent };
