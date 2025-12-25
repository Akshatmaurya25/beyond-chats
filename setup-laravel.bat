@echo off
echo ============================================
echo BeyondChats Laravel Setup Script
echo ============================================
echo.

:: Check if PHP is available
php -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: PHP is not installed or not in PATH
    echo Please install XAMPP and add C:\xampp\php to your PATH
    echo.
    echo After installing XAMPP:
    echo 1. Open System Properties ^> Environment Variables
    echo 2. Edit the "Path" variable under System variables
    echo 3. Add: C:\xampp\php
    echo 4. Restart this terminal and run this script again
    pause
    exit /b 1
)

echo PHP found!
php -v
echo.

:: Check if Composer is available
composer -V >nul 2>&1
if errorlevel 1 (
    echo Composer not found. Installing Composer...
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    php composer-setup.php
    php -r "unlink('composer-setup.php');"
    move composer.phar C:\xampp\php\composer.phar
    echo @php "%%~dp0composer.phar" %%* > C:\xampp\php\composer.bat
)

echo Composer found!
composer -V
echo.

:: Create Laravel project
echo Creating Laravel project...
cd /d "%~dp0"

if exist backend (
    echo Backend folder already exists. Skipping Laravel install.
) else (
    composer create-project laravel/laravel backend
)

cd backend

:: Copy template files
echo.
echo Copying template files...
if not exist app\Console\Commands mkdir app\Console\Commands

copy /Y "..\backend-laravel\app\Models\Article.php" "app\Models\"
copy /Y "..\backend-laravel\app\Http\Controllers\ArticleController.php" "app\Http\Controllers\"
copy /Y "..\backend-laravel\app\Console\Commands\ScrapeArticles.php" "app\Console\Commands\"
copy /Y "..\backend-laravel\routes\api.php" "routes\"

:: Copy migration (find and copy)
for %%f in ("..\backend-laravel\database\migrations\*.php") do (
    copy /Y "%%f" "database\migrations\"
)

:: Setup SQLite database
echo.
echo Setting up SQLite database...
if not exist database\database.sqlite (
    type nul > database\database.sqlite
)

:: Update .env for SQLite
echo.
echo Configuring environment...
if not exist .env copy .env.example .env

:: Generate app key
echo.
echo Generating application key...
php artisan key:generate

:: Run migrations
echo.
echo Running database migrations...
php artisan migrate --force

:: Scrape articles
echo.
echo Scraping articles from BeyondChats...
php artisan scrape:articles --page=15 --count=5

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo To start the Laravel server, run:
echo   cd backend
echo   php artisan serve
echo.
echo The API will be available at http://localhost:8000/api
echo.
pause
