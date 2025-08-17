# 🚀 Foundic Network - The Cleanest Space for Startup Founders

A modern social platform designed specifically for startup founders and investors to connect, collaborate, and build the future together.

## ✨ Features

### 🔐 Authentication & Profiles
- **Google OAuth Integration** - Secure sign-in with Google accounts
- **Role-Based Access** - Founder and Investor user types
- **Rich Profiles** - Customizable profiles with skills, experience, and social links
- **Profile Pictures** - Smart image cropping with 4:5 aspect ratio

### 💬 Social Features
- **The Wall** - Share updates, ideas, and achievements
- **Real-time Chat** - Direct messaging between users
- **Follow System** - Build your network of connections
- **Notifications** - Stay updated on follows, messages, and mentions

### 🎯 Founder Tools
- **Mission Pods** - Create and join collaborative projects
- **DNA Matching** - Find compatible co-founders based on personality
- **Opportunities** - Discover and apply to startup opportunities
- **Leaderboard** - Earn F-Coins and climb the rankings

### 💼 Investor Features
- **Startup Discovery** - Find promising startups to invest in
- **Founder Connections** - Connect directly with founders
- **Investment Tracking** - Monitor your investment pipeline

### 🔧 Technical Features
- **Real-time Updates** - Live notifications and messaging
- **Responsive Design** - Works perfectly on all devices
- **Dark/Light Mode** - Choose your preferred theme
- **Error Handling** - Robust error boundaries and fallbacks
- **Performance Optimized** - Fast loading and smooth interactions

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks and context
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Real-time**: Firestore real-time listeners

### Backend (Express.js)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **File Upload**: Cloudinary integration
- **Email**: Nodemailer for notifications
- **Security**: Helmet, CORS, rate limiting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Firebase project
- Google Cloud SDK (for CORS)

### 1. Clone Repository
```bash
git clone <repository-url>
cd foundic
```

### 2. Setup Client
```bash
cd client
npm install
cp .env.example .env.local
# Edit .env.local with your Firebase config
npm run dev
```

### 3. Setup Server
```bash
cd server
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. Configure Firebase
1. Create Firebase project
2. Enable Authentication (Google)
3. Enable Firestore Database
4. Enable Firebase Storage
5. Configure CORS for storage

For detailed setup instructions, see [SETUP_GUIDE.md](client/SETUP_GUIDE.md)

## 📱 Screenshots

*Coming soon - Add screenshots of key features*

## 🔧 Configuration

### Environment Variables

#### Client (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

#### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foundic
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
# ... other config
```

## 🐛 Troubleshooting

### Common Issues

#### Firebase CORS Errors
```bash
cd client
gsutil cors set cors.json gs://your-bucket.appspot.com
```

#### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env
- Verify network connectivity

#### Authentication Problems
- Check Firebase project settings
- Verify Google OAuth configuration
- Clear browser cache and cookies

For comprehensive troubleshooting, see [SETUP_GUIDE.md](client/SETUP_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add proper error handling
- Include TypeScript types
- Write meaningful commit messages
- Test your changes thoroughly

## 📚 Documentation

- [Setup Guide](client/SETUP_GUIDE.md) - Complete setup instructions
- [Firebase Setup](client/FIREBASE_SETUP.md) - Firebase configuration
- [CORS Fix Guide](client/CORS_FIX_GUIDE.md) - Storage CORS issues
- [Server API](server/README.md) - Backend API documentation

## 🔒 Security

- Environment variables for sensitive data
- Firebase security rules
- JWT token authentication
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration

## 📈 Performance

- Next.js App Router for optimal performance
- Image optimization and lazy loading
- Firestore query optimization
- Error boundaries for crash prevention
- Loading states and skeleton screens
- Efficient state management

## 🚀 Deployment

### Client (Vercel)
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Server (Railway/Heroku)
1. Set up MongoDB Atlas
2. Configure environment variables
3. Deploy using platform instructions

## 📊 Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase** - Backend services
- **Framer Motion** - Animations
- **React Hook Form** - Form handling

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Cloudinary** - File storage
- **Nodemailer** - Email service

### DevOps & Tools
- **Vercel** - Frontend hosting
- **Railway/Heroku** - Backend hosting
- **MongoDB Atlas** - Database hosting
- **Firebase** - Real-time features
- **Google Cloud** - Storage and services

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Express.js, MongoDB, Firebase
- **Design**: Modern, clean, responsive UI/UX
- **Features**: Real-time chat, social networking, founder tools

## 🌟 Acknowledgments

- Firebase for real-time backend services
- Tailwind CSS for the beautiful design system
- Next.js team for the amazing framework
- MongoDB for reliable data storage
- All contributors and beta testers

---

**Built with ❤️ for the startup community**

For support or questions, please check our documentation or open an issue.
