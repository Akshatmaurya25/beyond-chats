const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function getArticles() {
  return fetchApi('/articles');
}

export async function getArticle(id) {
  return fetchApi(`/articles/${id}`);
}

export async function getArticleWithUpdated(id) {
  const article = await fetchApi(`/articles/${id}`);
  return article;
}

export default {
  getArticles,
  getArticle,
  getArticleWithUpdated
};
