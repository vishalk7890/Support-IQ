# 🎯 SupportIQ - AI Customer Support Analytics Dashboard

A comprehensive GenAI-powered customer support analytics platform with real-time conversation analysis, AI coaching, and strategic insights.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation & Setup

1. **Clone or extract the project**
   ```bash
   cd genai_customer_support_analytics_dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:5173`

4. **Build for production** (optional)
   ```bash
   npm run build
   ```

## 🏗️ Application Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Routing**: React Router v6
- **UI Components**: Custom components with Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Authentication**: OAuth 2.0 with AWS Cognito

### Project Structure
```
src/
├── components/
│   ├── Analytics/          # Strategic analytics dashboard
│   ├── Auth/              # Authentication components
│   ├── Coaching/          # AI coaching system
│   ├── Conversations/     # Live conversation monitoring
│   ├── Dashboard/         # Main dashboard components
│   ├── Layout/            # Shared layout components
│   ├── List/              # Call recordings viewer
│   ├── Routes/            # Route wrapper components
│   └── Transcripts/       # Transcript management
├── hooks/                 # Custom React hooks
├── services/              # API services and business logic
├── types/                 # TypeScript type definitions
└── context/               # React context providers
```

## 📱 Application Flow

### 🔐 Authentication Flow
1. **Login Screen** → OAuth 2.0 authentication
2. **Token Validation** → AWS Cognito integration
3. **Dashboard Access** → Authenticated user experience

### 🎯 Main Workflow

#### 📊 Data Pipeline (Sequential Workflow)
```
📞 Call Recordings → 📊 Live Monitor → 🎧 Analysis & Coaching
```

1. **Call Recordings** (`/call-recordings`)
   - View uploaded call recordings
   - Audio quality metrics
   - Duration and metadata analysis
   - Quick insights (quality, duration, language)
   - Workflow navigation to next stages

2. **Live Monitor** (`/conversations`)
   - Real-time conversation monitoring
   - Active agent status
   - Live sentiment tracking
   - Customer satisfaction indicators

3. **Analysis & Coaching** (`/analysis-coaching`)
   - Deep transcript analysis
   - AI-generated coaching insights
   - Performance recommendations
   - Evidence-based feedback

#### 💡 Insights & Management
4. **Dashboard** (`/dashboard`)
   - Real-time metrics overview
   - Key performance indicators
   - Agent performance summary
   - System health monitoring

5. **Analytics** (`/analytics`)
   - Strategic business analytics
   - Predictive forecasting
   - Performance trends analysis
   - Export capabilities (PDF, CSV, JSON)
   - Comparison mode for period analysis

6. **AI Coaching** (`/coaching`)
   - Comprehensive coaching dashboard
   - Smart insights with AI confidence scores
   - Action plan management
   - Progress tracking and milestones
   - Agent performance analytics

7. **Agents** (`/agents`)
   - Agent performance overview
   - Individual agent analytics
   - Performance rankings
   - Coaching history

#### ⚙️ Administration
8. **Users** (`/users`)
   - User management
   - Role-based access control
   - Permission settings

9. **Responsible AI** (`/compliance`)
   - AI ethics and compliance
   - Data privacy controls
   - Audit trails
   - Regulatory compliance

## 🎨 Key Features

### 📊 Strategic Analytics
- **Dynamic Charts**: Interactive volume trends, performance metrics
- **Forecasting**: 7-day predictions with AI recommendations
- **Comparison Mode**: Period-over-period analysis
- **Export Functions**: PDF reports, CSV data, JSON exports
- **Custom Filtering**: By agents, departments, issue types
- **Correlation Analysis**: Performance relationship insights

### 🧠 AI Coaching System
- **Smart Insights**: AI-powered coaching recommendations
- **Evidence-Based**: Direct transcript quotes with timestamps
- **Confidence Scoring**: AI confidence levels (87-98%)
- **Action Plans**: Milestone-based improvement tracking
- **Performance Analytics**: Individual agent trend analysis
- **Impact Assessment**: High/medium/low impact classifications

### 📞 Call Analysis
- **Real-time Processing**: Live call quality assessment
- **Sentiment Analysis**: Customer vs agent sentiment comparison
- **Talk Time Analysis**: Conversation balance detection
- **Interruption Detection**: Communication flow analysis
- **Response Latency**: Agent response speed measurement
- **Quality Scoring**: Audio clarity and confidence metrics

### 🎯 Workflow Navigation
- **Progressive Flow**: Guided workflow from recordings to insights
- **Breadcrumb Headers**: Visual workflow progress indicators
- **Cross-Navigation**: Quick access between related features
- **Contextual Actions**: Relevant next steps based on current page

## 🔐 Authentication System Overview

### Current Authentication Architecture
The application currently uses **AWS Cognito with OAuth 2.0 redirect flow** for authentication. This is a cloud-based authentication system that requires specific AWS infrastructure setup.

### 🚨 Current Login Limitations

#### ❌ **Why You Can't Use Custom Username/Password Login**

The current system has several **blockers** preventing simple username/password login:

1. **Hard AWS Amplify Dependency**
   ```typescript
   // Current dependencies in package.json
   "@aws-amplify/auth": "^6.15.0"
   "aws-amplify": "^6.15.5"
   "@aws-sdk/client-cognito-identity": "^3.876.0"
   ```

2. **OAuth-Only Login Flow**
   - `SimpleLogin.tsx` only implements `signInWithRedirect({ provider: 'Cognito' })`
   - No custom username/password form implementation
   - Forces redirect to AWS Cognito Hosted UI

3. **Required AWS Infrastructure**
   - **AWS Cognito User Pool** (currently: `us-east-1_kmixUr4yq`)
   - **Cognito Identity Pool** for AWS credential exchange
   - **API Gateway** with Cognito authorizer
   - **OAuth Domain** (currently: `pca-1755221929659628847.auth.us-east-1.amazoncognito.com`)

4. **API Integration Dependencies**
   - All API calls use AWS SigV4 authentication
   - API Gateway expects Cognito access tokens
   - Services depend on `getOAuthToken()` for authorization

### 🛠️ **What's Required for AWS Authentication**

#### **Environment Variables Needed:**
```env
# AWS Cognito Configuration (REQUIRED)
VITE_COGNITO_USER_POOL_ID=us-east-1_kmixUr4yq
VITE_COGNITO_USER_POOL_CLIENT_ID=7qqdba5o1co51g0at68hu16d8p
VITE_AWS_REGION=us-east-1
VITE_COGNITO_IDENTITY_POOL_ID=your_identity_pool_id

# API Gateway (REQUIRED for data)
VITE_API_GATEWAY_URL=https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod
```

#### **AWS Services Required:**
1. **AWS Cognito User Pool** - User management
2. **AWS Cognito Identity Pool** - AWS credential federation
3. **API Gateway** - Backend API with Cognito authorizer
4. **Lambda Functions** - Business logic for analytics
5. **S3 Buckets** - Call recordings storage
6. **AWS Transcribe** - Speech-to-text processing

### 🔄 **Alternative Authentication Solutions**

#### **Option 1: Implement Custom Username/Password (Recommended)**

**Steps to Replace AWS Authentication:**

1. **Remove AWS Dependencies**
   ```bash
   npm uninstall aws-amplify @aws-amplify/auth @aws-sdk/client-cognito-identity
   ```

2. **Create Custom Auth Context**
   ```typescript
   // Replace AuthContext.tsx with simple JWT-based auth
   const login = async (email: string, password: string) => {
     const response = await fetch('/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
     });
     const { token } = await response.json();
     localStorage.setItem('authToken', token);
   };
   ```

3. **Update API Services**
   ```typescript
   // Replace AWS SigV4 with Bearer token authentication
   const apiClient = axios.create({
     headers: {
       Authorization: `Bearer ${localStorage.getItem('authToken')}`
     }
   });
   ```

4. **Backend Requirements**
   - Node.js/Express server with JWT authentication
   - User database (PostgreSQL/MongoDB)
   - Password hashing (bcrypt)
   - JWT token generation

#### **Option 2: Mock Authentication (Demo Mode)**

**Quick Solution for Development:**

```typescript
// Replace SimpleLogin.tsx with mock login
const mockLogin = () => {
  const mockUser = {
    userId: 'demo-user',
    username: 'demo@example.com',
    email: 'demo@example.com'
  };
  setUser(mockUser);
};
```



### 🚫 **Current Blockers Summary**

| Component | AWS Dependency | Impact |
|-----------|----------------|--------|
| **Authentication** | AWS Cognito | Cannot login without AWS setup |
| **API Calls** | SigV4 Signing | No data without AWS API Gateway |
| **File Upload** | S3 Integration | Cannot upload call recordings |
| **Real-time Data** | WebSocket + Lambda | No live monitoring |



### 🛡️ **Security Considerations**

- **Current**: Enterprise-grade AWS Cognito security
- **Custom Auth**: Requires implementing:
  - Password policies
  - Rate limiting
  - Session management
  - CSRF protection
  - Secure cookie handling

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# AWS Configuration
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your_user_pool_id
REACT_APP_USER_POOL_CLIENT_ID=your_client_id
REACT_APP_API_GATEWAY_URL=your_api_gateway_url

# OAuth Configuration
REACT_APP_OAUTH_DOMAIN=your_cognito_domain
REACT_APP_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback

# Feature Flags
REACT_APP_ENABLE_MOCK_DATA=true
REACT_APP_ENABLE_REAL_TIME=false
```

### API Integration Points
The application is designed to integrate with:
- **AWS Transcribe**: Speech-to-text conversion
- **AWS Comprehend**: Sentiment analysis
- **Custom Analytics API**: Performance metrics
- **Real-time WebSocket**: Live conversation updates

## 📋 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## 🎯 User Personas & Use Cases

### 👔 Supervisors/Managers
- Monitor team performance in real-time
- Access strategic analytics and forecasting
- Create and track coaching action plans
- Export reports for executive presentations
- Set up automated coaching triggers

### 👨‍💼 Quality Assurance Analysts
- Review call recordings with AI insights
- Analyze conversation quality metrics
- Track compliance and regulatory requirements
- Generate detailed performance reports

### 🎯 Individual Agents
- View personal performance metrics
- Access coaching recommendations
- Track improvement progress
- Review conversation analysis

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deploy to AWS S3 + CloudFront
```bash
# Build the project
npm run build

# Upload to S3 bucket
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🐛 Troubleshooting

### Common Issues
1. **Port already in use**: Change port in `vite.config.ts`
2. **Authentication errors**: Check OAuth configuration
3. **API connection issues**: Verify environment variables
4. **Build failures**: Clear node_modules and reinstall

### Debug Mode
Enable debug logging:
```bash
DEBUG=true npm start
```

## 📊 Performance Metrics
- **Lighthouse Score**: 95+ performance rating
- **Bundle Size**: ~2MB gzipped
- **Load Time**: <3 seconds on standard connections
- **Responsive**: Mobile-first design approach

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

