import puppeteer from 'puppeteer';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];


const FALLBACK_ARTICLES = {
  'chatbot': [
    { url: 'https://www.sprinklr.com/blog/livechat-vs-chatbot/', title: 'Live Chat vs Chatbot - Sprinklr' },
    { url: 'https://www.brevo.com/blog/chatbot-vs-live-chat/', title: 'Chatbot vs Live Chat - Brevo' }
  ],
  'live chat': [
    { url: 'https://www.chatbot.com/blog/chatbot-vs-livechat/', title: 'Chatbot vs Live Chat - ChatBot.com' },
    { url: 'https://getvoip.com/blog/chatbots-vs-live-chat/', title: 'Chatbots vs Live Chat - GetVoIP' }
  ],
  'customer support': [
    { url: 'https://www.gorgias.com/blog/chatbot-vs-live-chat', title: 'Chatbot vs Live Chat - Gorgias' },
    { url: 'https://hiverhq.com/blog/chatbot-vs-live-chat-what-to-choose', title: 'Chatbot vs Live Chat - Hiver' }
  ],
  'ai': [
    { url: 'https://www.8x8.com/blog/ai-chatbot-vs-live-chat', title: 'AI Chatbot vs Live Chat - 8x8' },
    { url: 'https://livechatai.com/blog/chatbot-vs-live-chat', title: 'Chatbot vs Live Chat - LiveChatAI' }
  ],
  'default': [
    { url: 'https://www.sprinklr.com/blog/livechat-vs-chatbot/', title: 'Live Chat vs Chatbot - Sprinklr' },
    { url: 'https://www.brevo.com/blog/chatbot-vs-live-chat/', title: 'Chatbot vs Live Chat - Brevo' }
  ]
};

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFallbackArticles(query, numResults = 2) {
  const queryLower = query.toLowerCase();

  for (const [keyword, articles] of Object.entries(FALLBACK_ARTICLES)) {
    if (keyword !== 'default' && queryLower.includes(keyword)) {
      console.log(`Using fallback articles for keyword: "${keyword}"`);
      return articles.slice(0, numResults);
    }
  }

  console.log('Using default fallback articles');
  return FALLBACK_ARTICLES.default.slice(0, numResults);
}

export async function searchGoogle(query, numResults = 2) {
  console.log(`Searching Google for: "${query}"`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000 + Math.random() * 2000);

    const results = await page.evaluate(() => {
      const links = [];
      const selectors = ['div.g', 'div[data-sokoban-container]', 'div.MjjYud', 'div.N54PNb'];

      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach(result => {
          const linkEl = result.querySelector('a[href^="http"]');
          const titleEl = result.querySelector('h3') || result.querySelector('a[href^="http"]');
          if (linkEl) {
            const href = linkEl.getAttribute('href');
            const title = titleEl ? titleEl.textContent : href;
            if (href && !href.includes('google.com') && !href.includes('beyondchats.com') &&
                !href.includes('youtube.com') && !links.some(l => l.url === href)) {
              links.push({ url: href, title: title || href });
            }
          }
        });
      }

      if (links.length === 0) {
        document.querySelectorAll('a[href^="http"]').forEach(a => {
          const href = a.getAttribute('href');
          if (href && !href.includes('google.com') && !href.includes('beyondchats.com') &&
              !href.includes('youtube.com') && !href.includes('accounts.google') &&
              !links.some(l => l.url === href)) {
            links.push({ url: href, title: a.textContent || href });
          }
        });
      }
      return links;
    });

    await browser.close();
    const filteredResults = results.filter(r => isArticleUrl(r.url)).slice(0, numResults);
    console.log(`Google found ${filteredResults.length} relevant article(s)`);

    if (filteredResults.length > 0) return filteredResults;

    // Try Bing
    console.log('Google returned no results, trying Bing...');
    const bingResults = await searchBing(query, numResults);
    if (bingResults.length > 0) return bingResults;

    // Try DuckDuckGo
    console.log('Bing returned no results, trying DuckDuckGo...');
    const ddgResults = await searchDuckDuckGo(query, numResults);
    if (ddgResults.length > 0) return ddgResults;

    // Use fallback articles
    console.log('All search engines blocked. Using fallback reference articles...');
    return getFallbackArticles(query, numResults);

  } catch (error) {
    console.error('Google search failed:', error.message);
    if (browser) await browser.close();

    // Try fallbacks
    try {
      const bingResults = await searchBing(query, numResults);
      if (bingResults.length > 0) return bingResults;
    } catch (e) { /* continue */ }

    try {
      const ddgResults = await searchDuckDuckGo(query, numResults);
      if (ddgResults.length > 0) return ddgResults;
    } catch (e) { /* continue */ }

    console.log('All search engines failed. Using fallback reference articles...');
    return getFallbackArticles(query, numResults);
  }
}

async function searchBing(query, numResults) {
  console.log('Trying Bing search...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });

    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(1500);

    const results = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('li.b_algo, .b_algo').forEach(result => {
        const linkEl = result.querySelector('a[href^="http"]');
        const titleEl = result.querySelector('h2');
        if (linkEl) {
          const href = linkEl.getAttribute('href');
          const title = titleEl ? titleEl.textContent : href;
          if (href && !href.includes('bing.com') && !href.includes('microsoft.com') &&
              !href.includes('beyondchats.com') && !href.includes('youtube.com') &&
              !links.some(l => l.url === href)) {
            links.push({ url: href, title: title || href });
          }
        }
      });
      return links;
    });

    const filteredResults = results.filter(r => isArticleUrl(r.url)).slice(0, numResults);
    console.log(`Bing found ${filteredResults.length} relevant article(s)`);
    return filteredResults;

  } catch (error) {
    console.error('Bing search failed:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function searchDuckDuckGo(query, numResults) {
  console.log('Trying DuckDuckGo search...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(1500);

    const results = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('.result__a, .result a, a.result__url').forEach(a => {
        const href = a.getAttribute('href');
        const title = a.textContent;
        if (href && href.startsWith('http') && !href.includes('duckduckgo.com') &&
            !href.includes('beyondchats.com') && !href.includes('youtube.com') &&
            !links.some(l => l.url === href)) {
          links.push({ url: href, title: title || href });
        }
      });
      return links;
    });

    const filteredResults = results.filter(r => isArticleUrl(r.url)).slice(0, numResults);
    console.log(`DuckDuckGo found ${filteredResults.length} relevant article(s)`);
    return filteredResults;

  } catch (error) {
    console.error('DuckDuckGo search failed:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

function isArticleUrl(url) {
  const articleIndicators = ['blog', 'article', 'post', 'news', 'guide', 'tutorial', 'story'];
  const urlLower = url.toLowerCase();
  return articleIndicators.some(indicator => urlLower.includes(indicator)) || /\d{4}\/\d{2}/.test(url) || true;
}

export default { searchGoogle };
