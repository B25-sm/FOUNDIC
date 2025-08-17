#!/bin/bash

# 🚀 Foundic Deployment Script
# This script helps automate the deployment process

echo "🚀 Starting Foundic Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not found. Please run 'git init' first."
    exit 1
fi

print_status "Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Committing them now..."
    git add .
    echo "Enter commit message (or press Enter for default):"
    read commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    git commit -m "$commit_message"
    print_success "Changes committed successfully!"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    print_error "No remote origin found. Please add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/foundic.git"
    exit 1
fi

print_status "Pushing to GitHub..."
git push origin main
if [ $? -eq 0 ]; then
    print_success "Code pushed to GitHub successfully!"
else
    print_error "Failed to push to GitHub. Please check your remote repository."
    exit 1
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. 🌐 Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com/dashboard"
echo "   - Click 'New Project'"
echo "   - Import your GitHub repository"
echo "   - Set root directory to 'client'"
echo "   - Configure environment variables"
echo ""
echo "2. 🚂 Deploy Backend to Railway:"
echo "   - Go to https://railway.app/dashboard"
echo "   - Click 'New Project'"
echo "   - Select 'Deploy from GitHub repo'"
echo "   - Set root directory to 'server'"
echo "   - Configure environment variables"
echo ""
echo "3. 🗄️ Set up MongoDB Atlas:"
echo "   - Create a cluster at https://cloud.mongodb.com"
echo "   - Create database user and get connection string"
echo "   - Update MONGODB_URI in Railway environment variables"
echo ""
echo "4. 🔥 Configure Firebase for production:"
echo "   - Add production domains to Firebase Auth"
echo "   - Update Firestore security rules"
echo "   - Configure Firebase Storage CORS"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
print_success "Happy deploying! 🚀"
