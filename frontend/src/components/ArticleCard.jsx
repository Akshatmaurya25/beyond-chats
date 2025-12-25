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
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              AI Enhanced
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Original
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
