import axios from 'axios';

const API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export async function getLatestOriginalArticle() {
  const response = await api.get('/articles/latest');
  return response.data;
}

export async function getAllArticles() {
  const response = await api.get('/articles');
  return response.data;
}

export async function getArticle(id) {
  const response = await api.get(`/articles/${id}`);
  return response.data;
}

export async function createArticle(articleData) {
  const response = await api.post('/articles', articleData);
  return response.data;
}

export async function updateArticle(id, articleData) {
  const response = await api.put(`/articles/${id}`, articleData);
  return response.data;
}

export default {
  getLatestOriginalArticle,
  getAllArticles,
  getArticle,
  createArticle,
  updateArticle
};
