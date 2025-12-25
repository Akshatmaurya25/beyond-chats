import { Link } from 'react-router-dom';

function ArticleCard({ article }) {
  const isUpdated = article.is_updated;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {article.image_url && (
        <div className="h-48 overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {isUpdated ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full border border-green-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
              </svg>
              AI Enhanced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd"/>
              </svg>
              Original Article
            </span>
          )}
          {article.published_date && (
            <span className="text-xs text-gray-500">
              {new Date(article.published_date).toLocaleDateString()}
            </span>
          )}
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        {article.author && (
          <p className="text-sm text-gray-500 mb-3">By {article.author}</p>
        )}
        <Link
          to={`/article/${article.id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Read More
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default ArticleCard;
