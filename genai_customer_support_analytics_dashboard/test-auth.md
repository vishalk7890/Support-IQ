# JWT Authentication Testing Guide

## Current Implementation Status ✅

Your application now properly implements **Amazon Cognito User Pool authentication with JWT Bearer tokens** as requested:

### ✅ **What's Fixed:**

1. **Login Method: Amazon Cognito User Pool** ✅
   - Uses AWS Amplify's `signIn()` function
   - Properly configured with Cognito User Pool
   - Username/email and password authentication

2. **Authorization: JWT tokens in API request headers** ✅
   - All API requests now include `Authorization: Bearer <JWT_TOKEN>` headers
   - Unified JWT-based API client (`JwtApiClient`)
   - Consistent token handling across all services

### ✅ **Updated Components:**

1. **AuthContext** - Cleaned up to focus on JWT tokens only
2. **Login Component** - Fixed integration with AuthContext
3. **SignUp Component** - Fixed integration with AuthContext  
4. **API Services** - Updated to use JWT Bearer tokens
5. **API Client** - Unified JWT-based authentication

## Testing Authentication Flow

### 1. **Manual Testing (Browser)**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test signup flow:**
   - Go to `/signup`
   - Create a new account
   - Check email for verification code
   - Verify account in Cognito console if needed

3. **Test login flow:**
   - Go to `/login` 
   - Login with verified credentials
   - Should redirect to `/dashboard`

4. **Test API calls:**
   - Open browser DevTools → Network tab
   - Make API calls from the dashboard
   - Verify requests include `Authorization: Bearer <JWT_TOKEN>` header

### 2. **cURL Testing (Direct API)**

For testing your backend API endpoints directly with cURL:

#### **Step 1: Get JWT Token**
First, you need to authenticate with Cognito to get a JWT token. You can either:

**Option A: Use AWS CLI**
```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_COGNITO_CLIENT_ID \
  --auth-parameters USERNAME=your-email@example.com,PASSWORD=your-password \
  --region us-east-1
```

**Option B: Extract from browser (easiest for testing)**
1. Login through your web app
2. Open DevTools → Application → Session Storage
3. Look for AWS Amplify auth tokens
4. Copy the `accessToken`

#### **Step 2: Test API with cURL**
```bash
# Test your main API endpoint
curl -X GET https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/analytics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-api-key: YOUR_API_KEY_HERE"

# Test jobs endpoint
curl -X GET https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-api-key: YOUR_API_KEY_HERE"

# Test users API (if configured)
curl -X GET YOUR_USERS_API_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

### 3. **Environment Variables**

Make sure these are set in your `.env` file:
```env
VITE_COGNITO_USER_POOL_ID=us-east-1_kmixUr4yq
VITE_COGNITO_USER_POOL_CLIENT_ID=7qqdba5o1co51g0at68hu16d8p
VITE_AWS_REGION=us-east-1
VITE_API_KEY=your-api-key-here
VITE_USERS_API_URL=your-users-api-url-here
```

## Key Changes Made

### 1. **AuthContext.tsx**
- ✅ Removed AWS Identity Pool and temporary credentials
- ✅ Simplified to JWT token management only
- ✅ Added `getJwtToken()` method
- ✅ Fixed login/signup integration

### 2. **API Client (utils/apiClient.ts)**
- ✅ Replaced SigV4 signing with JWT Bearer tokens
- ✅ Created `JwtApiClient` class
- ✅ Automatic token extraction from AWS Amplify session
- ✅ Proper error handling and retry logic

### 3. **Services**
- ✅ `apiService.ts` - Updated to use JWT API client
- ✅ `usersApi.ts` - Already using JWT tokens (kept as-is)
- ✅ Consistent authentication across all services

### 4. **Components**
- ✅ `Login.tsx` - Fixed integration with AuthContext
- ✅ `SignUp.tsx` - Fixed integration with AuthContext
- ✅ Matching visual design between login/signup

## Next Steps

1. **Test the complete flow:**
   - Signup → Email verification → Login → API calls
   
2. **Verify JWT tokens in requests:**
   - Check Network tab in DevTools
   - Ensure all API calls include `Authorization: Bearer <token>`

3. **Monitor authentication:**
   - Check token expiration handling
   - Verify automatic refresh logic

Your application now follows the proper **Amazon Cognito User Pool authentication with JWT Bearer tokens** pattern! 🎉
