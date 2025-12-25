import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticle, getArticles } from '../services/api';

function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticle, setRelatedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOriginal, setShowOriginal] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await getArticle(id);
        const currentArticle = response.data;
        setArticle(currentArticle);

        const allArticlesResponse = await getArticles();
        const allArticles = allArticlesResponse.data || [];

        if (currentArticle.is_updated && currentArticle.original_article_id) {
          const original = allArticles.find(a => a.id === currentArticle.original_article_id);
          setRelatedArticle(original);
          setShowOriginal(false);
        } else if (!currentArticle.is_updated) {
          const enhanced = allArticles.find(a => a.original_article_id === currentArticle.id);
          setRelatedArticle(enhanced);
          setShowOriginal(true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error || 'Article not found'}</p>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:underline">
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const displayArticle = showOriginal
    ? (relatedArticle && !article.is_updated ? article : relatedArticle || article)
    : (article.is_updated ? article : relatedArticle || article);

  const currentlyShowing = showOriginal ? 'original' : 'enhanced';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Articles
      </Link>

      {relatedArticle && (
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-3">This article has two versions:</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowOriginal(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentlyShowing === 'original'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              Original Article
            </button>
            <button
              onClick={() => setShowOriginal(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentlyShowing === 'enhanced'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              AI Enhanced Version
            </button>
          </div>
        </div>
      )}

      <article className="bg-white rounded-xl shadow-md overflow-hidden">
        {displayArticle?.image_url && (
          <div className="h-64 md:h-96 overflow-hidden">
            <img
              src={displayArticle.image_url}
              alt={displayArticle.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            {displayArticle?.is_updated ? (
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                AI Enhanced
              </span>
            ) : (
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                Original
              </span>
            )}
            {displayArticle?.published_date && (
              <span className="text-gray-500">
                {new Date(displayArticle.published_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {displayArticle?.title}
          </h1>

          {displayArticle?.author && (
            <p className="text-gray-600 mb-6">By {displayArticle.author}</p>
          )}

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: displayArticle?.content || '' }}
          />

          {displayArticle?.source_url && (
            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-gray-500">
                Original source:{' '}
                <a
                  href={displayArticle.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {displayArticle.source_url}
                </a>
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

export default ArticleDetail;
