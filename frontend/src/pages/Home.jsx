import { useState, useEffect } from 'react';
import ArticleCard from '../components/ArticleCard';
import { getArticles } from '../services/api';

function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        const response = await getArticles();
        setArticles(response.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter(article => {
    if (filter === 'original') return !article.is_updated;
    if (filter === 'enhanced') return article.is_updated;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Articles</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure the Laravel API is running at {import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Articles</h1>
        <p className="text-gray-600">
          Browse original articles from BeyondChats and their AI-enhanced versions
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({articles.length})
        </button>
        <button
          onClick={() => setFilter('original')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'original'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Original ({articles.filter(a => !a.is_updated).length})
        </button>
        <button
          onClick={() => setFilter('enhanced')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'enhanced'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          AI Enhanced ({articles.filter(a => a.is_updated).length})
        </button>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
