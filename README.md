# BeyondChats Article System

A full-stack monorepo application that scrapes articles from BeyondChats blog, processes them using AI, and displays them in a modern web interface.

## Live Demo

**Frontend:** [Your Vercel URL here]

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BeyondChats Article System                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   PHASE 1        │     │   PHASE 2        │     │   PHASE 3        │
│   Laravel API    │     │   NodeJS Script  │     │   React Frontend │
│                  │     │                  │     │                  │
│ ┌──────────────┐ │     │ ┌──────────────┐ │     │ ┌──────────────┐ │
│ │   Scraper    │ │     │ │Google Search │ │     │ │  Home Page   │ │
│ │  Command     │ │     │ │ (Puppeteer)  │ │     │ │ Article List │ │
│ └──────┬───────┘ │     │ └──────┬───────┘ │     │ └──────────────┘ │
│        │         │     │        │         │     │                  │
│        ▼         │     │        ▼         │     │ ┌──────────────┐ │
│ ┌──────────────┐ │     │ ┌──────────────┐ │     │ │Article Detail│ │
│ │   SQLite     │ │     │ │  Scraper     │ │     │ │Original/     │ │
│ │   Database   │◄├────►│ │  Service     │ │     │ │Enhanced View │ │
│ └──────────────┘ │     │ └──────┬───────┘ │     │ └──────────────┘ │
│        ▲         │     │        │         │     │        ▲         │
│        │         │     │        ▼         │     │        │         │
│ ┌──────────────┐ │     │ ┌──────────────┐ │     │        │         │
│ │  CRUD APIs   │◄├────►│ │  Gemini AI   │ │     │        │         │
│ │  /articles   │ │     │ │  Rewriter    │ │     │        │         │
│ └──────────────┘ │     │ └──────────────┘ │     └────────┼─────────┘
└────────┬─────────┘     └─────────────────-┘              │
         │                                                  │
         └──────────────────────────────────────────────────┘
                              REST API

Data Flow:
1. Laravel scrapes BeyondChats blog → stores in SQLite
2. NodeJS fetches article → searches Google → scrapes competitors
3. Gemini AI rewrites article → posts back to Laravel
4. React fetches and displays both versions
```

## Project Structure

```
BeyondChats/
├── backend/                    # Laravel API (to be created)
│   ├── app/
│   │   ├── Models/Article.php
│   │   ├── Http/Controllers/ArticleController.php
│   │   └── Console/Commands/ScrapeArticles.php
│   ├── database/migrations/
│   └── routes/api.php
│
├── backend-laravel/            # Laravel template files (pre-made)
│   └── [Copy these to backend/ after Laravel install]
│
├── node-script/                # NodeJS Article Processor
│   ├── index.js                # Main entry point
│   ├── services/
│   │   ├── laravelApi.js       # Laravel API client
│   │   ├── googleSearch.js     # Puppeteer Google search
│   │   ├── scraper.js          # Article content scraper
│   │   └── gemini.js           # Gemini AI integration
│   └── package.json
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   └── ArticleCard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── ArticleDetail.jsx
│   │   └── services/api.js
│   └── package.json
│
├── README.md
└── .gitignore
```

## Prerequisites

- **PHP 8.1+** with Composer (via XAMPP, Laragon, or standalone)
- **Node.js 18+** with npm
- **Google Gemini API Key** (free at https://makersuite.google.com/app/apikey)

## Local Setup Instructions

### Step 1: Install XAMPP (if not already installed)

1. Download XAMPP from https://www.apachefriends.org/download.html
2. Install and start Apache (PHP is included)
3. Add PHP to your PATH:
   - Windows: Add `C:\xampp\php` to System Environment Variables → Path
   - Mac: Add `/Applications/XAMPP/bin` to `~/.zshrc` or `~/.bash_profile`

### Step 2: Set Up Laravel Backend

```bash
# Navigate to project root
cd BeyondChats

# Create Laravel project
composer create-project laravel/laravel backend

# Navigate to backend
cd backend

# Copy template files
copy ..\backend-laravel\app\Models\Article.php app\Models\
copy ..\backend-laravel\app\Http\Controllers\ArticleController.php app\Http\Controllers\
copy ..\backend-laravel\app\Console\Commands\ScrapeArticles.php app\Console\Commands\
copy ..\backend-laravel\database\migrations\*.php database\migrations\
copy ..\backend-laravel\routes\api.php routes\

# Create SQLite database
type nul > database\database.sqlite

# Copy environment file
copy .env.example .env

# Update .env with SQLite settings
# Change DB_CONNECTION=sqlite
# Comment out other DB_ variables

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Scrape articles from BeyondChats
php artisan scrape:articles --page=15 --count=5

# Start Laravel server
php artisan serve
```

The API will be available at `http://localhost:8000/api`

### Step 3: Set Up NodeJS Script

```bash
# Navigate to node-script
cd node-script

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_key_here

# Run the script (make sure Laravel is running first)
npm start
```

### Step 4: Set Up React Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not done)
npm install

# Create .env file
copy .env.example .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles |
| GET | `/api/articles/latest` | Get latest original article |
| GET | `/api/articles/{id}` | Get single article |
| POST | `/api/articles` | Create new article |
| PUT | `/api/articles/{id}` | Update article |
| DELETE | `/api/articles/{id}` | Delete article |

### Example Response

```json
{
  "data": {
    "id": 1,
    "title": "Article Title",
    "slug": "article-title",
    "content": "<p>Article content...</p>",
    "excerpt": "Brief description...",
    "author": "Author Name",
    "published_date": "2024-12-25",
    "image_url": "https://...",
    "source_url": "https://beyondchats.com/blogs/...",
    "is_updated": false,
    "original_article_id": null,
    "references": null,
    "created_at": "2024-12-25T00:00:00.000000Z",
    "updated_at": "2024-12-25T00:00:00.000000Z"
  }
}
```

## Environment Variables

### Laravel (`backend/.env`)
```
DB_CONNECTION=sqlite
```

### NodeJS (`node-script/.env`)
```
LARAVEL_API_URL=http://localhost:8000/api
GEMINI_API_KEY=your_gemini_api_key
```

### React (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000/api
```

## Features

### Phase 1: Laravel Backend
- Scrapes 5 oldest articles from BeyondChats blog (page 15)
- Stores articles in SQLite database
- Full CRUD REST API for articles
- Article model with relationships (original ↔ updated)

### Phase 2: NodeJS Script
- Fetches latest article from Laravel API
- Searches Google for similar articles using Puppeteer
- Scrapes content from top 2 competing articles
- Uses Google Gemini AI to rewrite/enhance the article
- Posts enhanced version back to Laravel API
- Includes citations to reference sources

### Phase 3: React Frontend
- Responsive article listing with filter (All/Original/Enhanced)
- Article detail page with full content
- Toggle between original and AI-enhanced versions
- Professional UI with TailwindCSS
- Error handling and loading states

## Deployment

### Frontend to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variable: `VITE_API_URL` = your deployed Laravel API URL
4. Deploy

### Backend Deployment Options
- **Railway**: Easy Laravel deployment
- **Render**: Free tier available
- **DigitalOcean App Platform**: Full control

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 11, PHP 8.2, SQLite |
| Script | Node.js 18+, Puppeteer, Cheerio, Gemini AI |
| Frontend | React 18, Vite, TailwindCSS, React Router |
| Database | SQLite |
| AI | Google Gemini 1.5 Flash |

## Assumptions & Trade-offs

1. **SQLite over MySQL**: Simpler setup, no external database server needed
2. **Puppeteer for Google Search**: Free alternative to paid APIs, may face rate limits
3. **Gemini Flash**: Free tier, good balance of speed and quality
4. **Article content extraction**: Best-effort parsing, may not work perfectly on all sites

## Known Limitations

- Google search may be rate-limited with heavy use
- Some websites may block scraping
- Article content extraction varies by source site structure

## Author

Built for BeyondChats Technical Assessment

---

**Note**: This project uses AI tools as permitted by the assignment guidelines. The code structure, architecture decisions, and implementation reflect my own engineering judgment.
