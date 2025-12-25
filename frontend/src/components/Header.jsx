import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <span className="text-xl font-bold">BeyondChats</span>
          </Link>
          <nav>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Articles
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
