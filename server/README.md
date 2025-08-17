# Foundic Server API

A comprehensive backend API for the Foundic platform - the cleanest and most trusted space for startup founders, co-founders, and investors.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with role-based access
- **User Management**: Founders, investors, and admin roles
- **DNA Matching**: Algorithmic co-founder matching system
- **Mission Pods**: 60-day co-building sprint modules
- **Social Walls**: Fail Forward, Signal Boost, and Investor Connect
- **Founder Compass**: Progress tracking dashboard
- **F-Coin System**: Gamified engagement rewards
- **Jobs Board**: Optional job posting and application system

### Technical Features
- **RESTful API**: Clean, consistent endpoints
- **MongoDB Integration**: Scalable document database
- **Input Validation**: Express-validator middleware
- **Rate Limiting**: API protection
- **Error Handling**: Comprehensive error management
- **File Upload**: Cloudinary integration
- **Email Notifications**: Nodemailer integration

## 📁 Project Structure

```
server/
├── models/           # Database schemas
│   ├── User.js      # User model with roles
│   ├── Pod.js       # Mission pods model
│   ├── Post.js      # Social posts model
│   ├── Match.js     # DNA matching model
│   └── Job.js       # Jobs board model
├── routes/           # API endpoints
│   ├── auth.js      # Authentication routes
│   ├── users.js     # User management
│   ├── pods.js      # Mission pods
│   ├── posts.js     # Social walls
│   ├── matches.js   # DNA matching
│   ├── compass.js   # Founder compass
│   ├── investors.js # Investor features
│   └── jobs.js      # Jobs board
├── middleware/       # Custom middleware
│   └── auth.js      # JWT authentication
├── server.js        # Main server file
├── package.json     # Dependencies
└── env.example      # Environment variables
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foundic/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/foundic

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Client URL
CLIENT_URL=http://localhost:3000

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "founder"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/user`
Get current user profile

### User Management

#### GET `/api/users/profile`
Get user profile

#### PUT `/api/users/profile`
Update user profile

#### GET `/api/users/leaders`
Get leaderboard by F-Coins

### Mission Pods

#### GET `/api/pods`
Get all pods with filters

#### POST `/api/pods`
Create a new pod

#### POST `/api/pods/:id/apply`
Apply to join a pod

### Social Walls

#### GET `/api/posts`
Get posts with filters

#### POST `/api/posts`
Create a new post

#### POST `/api/posts/:id/like`
Like/unlike a post

### DNA Matching

#### GET `/api/matches`
Get user matches

#### POST `/api/matches/generate`
Generate new matches

#### POST `/api/matches/:id/message`
Send message in match

### Founder Compass

#### GET `/api/compass/dashboard`
Get founder dashboard

#### PUT `/api/compass/update-stage`
Update startup stage

### Investor Features

#### GET `/api/investors/dashboard`
Get investor dashboard

#### GET `/api/investors/founders`
Get filtered founders

#### POST `/api/investors/interest`
Express interest in founder

### Jobs Board

#### GET `/api/jobs`
Get all jobs

#### POST `/api/jobs`
Create a new job

#### POST `/api/jobs/:id/apply`
Apply for a job

## 🔐 Authentication

All protected routes require a JWT token in the header:
```
x-auth-token: <your-jwt-token>
```

## 🎯 Role-Based Access

- **Founders**: Can create pods, posts, update compass, apply for jobs
- **Investors**: Can browse founders, express interest, access investor dashboard
- **Admins**: Can moderate content, manage users, access admin features

## 💰 F-Coin System

Users earn F-Coins for various activities:
- Creating posts: 10-20 coins
- Receiving likes: 1 coin
- Receiving comments: 2 coins
- Stage progression: 50-500 coins
- Investor interest: 25 coins

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
npm test
```

## 📊 Database Schema

### User Model
- Basic info (name, email, password)
- Role-based fields (founder, investor, admin)
- Startup information for founders
- Investor preferences for investors
- DNA matching preferences
- F-Coin system
- Social connections

### Pod Model
- Mission details and goals
- Team members and roles
- Progress tracking
- Compensation models
- Communication tools

### Post Model
- Content and media
- Type-specific fields (failures, signals, investor connects)
- Engagement metrics
- Moderation features

### Match Model
- Compatibility scores
- Communication system
- Match preferences
- Outcome tracking

### Job Model
- Job details and requirements
- Application system
- Employer information
- Pod associations

## 🔧 Configuration

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable in server.js

### File Upload
- Max file size: 5MB
- Supported formats: images, videos, documents
- Cloudinary integration

### Email Notifications
- SMTP configuration
- Template system
- Notification preferences

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@foundic.com or create an issue in the repository.

---

**Foundic** - Building the future of startup collaboration 🚀 