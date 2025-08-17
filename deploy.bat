@echo off
echo.
echo 🚀 Starting Foundic Deployment Process...
echo.

REM Check if git is initialized
if not exist ".git" (
    echo [ERROR] Git repository not found. Please run 'git init' first.
    pause
    exit /b 1
)

echo [INFO] Checking for uncommitted changes...
git status --porcelain > nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] You have uncommitted changes. Committing them now...
    git add .
    set /p commit_message="Enter commit message (or press Enter for default): "
    if "%commit_message%"=="" set commit_message=Deploy: %date% %time%
    git commit -m "%commit_message%"
    echo [SUCCESS] Changes committed successfully!
)

REM Check if remote origin exists
git remote get-url origin > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No remote origin found. Please add your GitHub repository:
    echo git remote add origin https://github.com/yourusername/foundic.git
    pause
    exit /b 1
)

echo [INFO] Pushing to GitHub...
git push origin main
if %errorlevel% equ 0 (
    echo [SUCCESS] Code pushed to GitHub successfully!
) else (
    echo [ERROR] Failed to push to GitHub. Please check your remote repository.
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment preparation complete!
echo.
echo Next steps:
echo 1. 🌐 Deploy Frontend to Vercel:
echo    - Go to https://vercel.com/dashboard
echo    - Click 'New Project'
echo    - Import your GitHub repository
echo    - Set root directory to 'client'
echo    - Configure environment variables
echo.
echo 2. 🚂 Deploy Backend to Railway:
echo    - Go to https://railway.app/dashboard
echo    - Click 'New Project'
echo    - Select 'Deploy from GitHub repo'
echo    - Set root directory to 'server'
echo    - Configure environment variables
echo.
echo 3. 🗄️ Set up MongoDB Atlas:
echo    - Create a cluster at https://cloud.mongodb.com
echo    - Create database user and get connection string
echo    - Update MONGODB_URI in Railway environment variables
echo.
echo 4. 🔥 Configure Firebase for production:
echo    - Add production domains to Firebase Auth
echo    - Update Firestore security rules
echo    - Configure Firebase Storage CORS
echo.
echo 📚 For detailed instructions, see DEPLOYMENT_GUIDE.md
echo.
echo [SUCCESS] Happy deploying! 🚀
echo.
pause
