import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

export function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

export async function rewriteArticle(originalArticle, referenceArticles) {
  if (!model) {
    throw new Error('Gemini not initialized. Call initGemini() first.');
  }

  const prompt = buildPrompt(originalArticle, referenceArticles);

  console.log('Calling Gemini API to rewrite article...');

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Article rewritten successfully');
    return text;

  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw error;
  }
}

function buildPrompt(originalArticle, referenceArticles) {
  const referencesText = referenceArticles.map((ref, i) => `
Reference Article ${i + 1}: "${ref.title}"
URL: ${ref.url}
Content:
${ref.content.substring(0, 3000)}
`).join('\n---\n');

  return `You are an expert content writer. Your task is to rewrite and improve an article based on reference articles that rank well on Google for similar topics.

ORIGINAL ARTICLE:
Title: ${originalArticle.title}
Content:
${originalArticle.content}

REFERENCE ARTICLES (from top Google search results):
${referencesText}

INSTRUCTIONS:
1. Rewrite the original article to improve its quality, readability, and SEO
2. Incorporate relevant insights, structure, and formatting patterns from the reference articles
3. Keep the core message and topic of the original article
4. Make the article comprehensive and well-structured with clear headings
5. Use engaging language that matches the style of high-ranking articles
6. Maintain factual accuracy
7. The output should be in clean HTML format with proper headings (h2, h3), paragraphs, and lists where appropriate
8. DO NOT include the reference citations in your output - they will be added separately

OUTPUT FORMAT:
Return ONLY the rewritten article content in HTML format. Start directly with the content (no title tag needed as it will be added separately).`;
}

export default { initGemini, rewriteArticle };
