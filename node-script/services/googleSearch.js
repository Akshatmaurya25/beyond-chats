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

export async function searchGoogle(query, numResults = 2) {
  console.log(`Searching Google for: "${query}"`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1280, height: 800 });

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await delay(1000 + Math.random() * 2000);

    const results = await page.evaluate(() => {
      const links = [];
      const searchResults = document.querySelectorAll('div.g');

      searchResults.forEach(result => {
        const linkEl = result.querySelector('a[href^="http"]');
        const titleEl = result.querySelector('h3');

        if (linkEl && titleEl) {
          const href = linkEl.getAttribute('href');
          if (href && !href.includes('google.com') && !href.includes('beyondchats.com')) {
            links.push({
              url: href,
              title: titleEl.textContent
            });
          }
        }
      });

      return links;
    });

    const filteredResults = results
      .filter(r => isArticleUrl(r.url))
      .slice(0, numResults);

    console.log(`Found ${filteredResults.length} relevant article(s)`);
    return filteredResults;

  } catch (error) {
    console.error('Google search failed:', error.message);
    console.log('Falling back to DuckDuckGo...');
    return searchDuckDuckGo(query, numResults, browser);
  } finally {
    await browser.close();
  }
}

async function searchDuckDuckGo(query, numResults, existingBrowser) {
  const browser = existingBrowser || await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());

    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await delay(2000);

    const results = await page.evaluate(() => {
      const links = [];
      const searchResults = document.querySelectorAll('[data-testid="result"]');

      searchResults.forEach(result => {
        const linkEl = result.querySelector('a[href^="http"]');
        const titleEl = result.querySelector('h2');

        if (linkEl && titleEl) {
          const href = linkEl.getAttribute('href');
          if (href && !href.includes('duckduckgo.com') && !href.includes('beyondchats.com')) {
            links.push({
              url: href,
              title: titleEl.textContent
            });
          }
        }
      });

      return links;
    });

    return results.filter(r => isArticleUrl(r.url)).slice(0, numResults);

  } finally {
    if (!existingBrowser) {
      await browser.close();
    }
  }
}

function isArticleUrl(url) {
  const articleIndicators = ['blog', 'article', 'post', 'news', 'guide', 'tutorial', 'story'];
  const urlLower = url.toLowerCase();
  return articleIndicators.some(indicator => urlLower.includes(indicator)) ||
         /\d{4}\/\d{2}/.test(url) ||
         true;
}

export default { searchGoogle };
