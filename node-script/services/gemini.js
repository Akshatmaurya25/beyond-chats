import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let model = null;

export function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);

  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function rewriteArticle(originalArticle, referenceArticles) {
  if (!model) {
    throw new Error("Gemini not initialized. Call initGemini() first.");
  }

  const prompt = buildPrompt(originalArticle, referenceArticles);

  console.log("Calling Gemini API to rewrite article...");

  // Retry logic for rate limits
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("Article rewritten successfully");
      return text;
    } catch (error) {
      console.error(
        `Gemini API error (attempt ${attempt}/${maxRetries}):`,
        error.message
      );

      // Check if it's a rate limit error
      if (error.message.includes("429") || error.message.includes("quota")) {
        if (attempt < maxRetries) {
          const waitTime = 60 * attempt; // Wait 60s, 120s, 180s
          console.log(
            `Rate limited. Waiting ${waitTime} seconds before retry...`
          );
          await delay(waitTime * 1000);
          continue;
        }
      }

      throw error;
    }
  }
}

function buildPrompt(originalArticle, referenceArticles) {
  // If we have reference articles, use them
  if (referenceArticles && referenceArticles.length > 0) {
    const referencesText = referenceArticles
      .map(
        (ref, i) => `
Reference Article ${i + 1}: "${ref.title}"
URL: ${ref.url}
Content:
${ref.content.substring(0, 3000)}
`
      )
      .join("\n---\n");

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

  // No reference articles - enhance using AI knowledge only
  return `You are an expert content writer and SEO specialist. Your task is to significantly enhance and expand an article to make it more comprehensive, engaging, and SEO-friendly.

ORIGINAL ARTICLE:
Title: ${originalArticle.title}
Content:
${originalArticle.content}

INSTRUCTIONS:
1. Significantly expand and improve this article using your knowledge of the topic
2. Add more depth, examples, statistics, and practical insights
3. Structure the article with clear headings (h2, h3) for better readability
4. Include relevant industry best practices and trends
5. Make it comprehensive - aim for 1500-2000 words
6. Use engaging, professional language
7. Add bullet points and lists where appropriate
8. Maintain factual accuracy - only include verifiable information
9. Output should be in clean HTML format

OUTPUT FORMAT:
Return ONLY the enhanced article content in HTML format. Start directly with the content (no title tag needed).`;
}

export default { initGemini, rewriteArticle };
