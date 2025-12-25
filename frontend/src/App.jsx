import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import './App.css';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 text-gray-400 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p>BeyondChats Article System</p>
            <p className="text-sm mt-2">Technical Assessment Project</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
