# AWS Cognito + Identity Pool + SigV4 Authentication Setup Guide

This guide explains how to set up the complete authentication flow: **Cognito User Pool → Identity Pool → SigV4 signed API requests**.

## Architecture Overview

```
User Login → Cognito User Pool → Get ID Token → 
Identity Pool → Get AWS Credentials → 
Sign API Requests with SigV4 → API Gateway validates signature
```

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured (optional, for setup)
3. Node.js and npm/yarn installed

## Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

The following AWS SDK packages are already added to `package.json`:
- `@aws-sdk/client-cognito-identity`
- `@aws-sdk/credential-providers`
- `@smithy/signature-v4` (updated from deprecated `@aws-sdk/signature-v4`)
- `@aws-sdk/util-format-url`
- `@aws-crypto/sha256-js`

## Step 2: AWS Cognito Setup

### 2.1 Create Cognito User Pool

1. Go to AWS Console → Cognito → User Pools
2. Create a new User Pool with these settings:
   - **Authentication providers**: Username, Email
   - **Password policy**: As per your requirements
   - **MFA**: Optional (recommended for production)
   - **App client**: Create without client secret
   - Note down: `User Pool ID` and `App Client ID`

### 2.2 Create Cognito Identity Pool

1. Go to AWS Console → Cognito → Identity Pools
2. Create a new Identity Pool:
   - **Identity pool name**: Your choice
   - **Authentication providers**: 
     - Cognito User Pool
     - User Pool ID: (from step 2.1)
     - App Client ID: (from step 2.1)
   - **Unauthenticated access**: Disable
   - Note down: `Identity Pool ID`

### 2.3 Configure IAM Roles

The Identity Pool will create two IAM roles:
- **Authenticated role**: For authenticated users
- **Unauthenticated role**: For guest users (if enabled)

Edit the **Authenticated role** to include permissions for your API Gateway:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "execute-api:Invoke"
            ],
            "Resource": [
                "arn:aws:execute-api:REGION:ACCOUNT-ID:API-ID/*"
            ]
        }
    ]
}
```

## Step 3: API Gateway Setup

### 3.1 Create API Gateway

1. Create a new REST API in API Gateway
2. Create your resources and methods
3. **Important**: Set Authorization to **AWS_IAM** (not Cognito User Pool)

### 3.2 Enable CORS (if needed)

For browser requests, enable CORS on your API Gateway resources.

## Step 4: Environment Configuration

Update your `.env.local` file with the actual values:

```env
# AWS Configuration
VITE_AWS_REGION=your-aws-region
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_USER_POOL_CLIENT_ID=your-app-client-id
VITE_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
```

## Step 5: Configure AWS Amplify

Create or update `src/aws-config.ts`:

```typescript
import { Amplify } from 'aws-amplify';

const config = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      region: import.meta.env.VITE_AWS_REGION,
    }
  }
};

Amplify.configure(config);
```

Import this in your `main.tsx` or `App.tsx`.

## Step 6: Usage Examples

### Basic Authentication

```typescript
import { useAuth } from './context/AuthContext';

function LoginComponent() {
  const { login, user, loading } = useAuth();
  
  const handleLogin = async () => {
    try {
      const result = await login({
        email: 'user@example.com',
        password: 'password123'
      });
      
      if (result.status === 'SIGNED_IN') {
        console.log('Logged in successfully!');
        console.log('AWS Credentials:', user?.credentials);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <p>Welcome, {user.username}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Making API Requests

```typescript
import { useAuthenticatedRequest } from './hooks/useApiClient';

function ApiComponent() {
  const { makeRequest, isReady } = useAuthenticatedRequest();
  
  const fetchData = async () => {
    if (!isReady) return;
    
    try {
      const response = await makeRequest('https://your-api.amazonaws.com/data', {
        method: 'GET'
      });
      console.log('API Response:', response);
    } catch (error) {
      console.error('API Error:', error);
    }
  };
  
  return (
    <div>
      <button onClick={fetchData} disabled={!isReady}>
        Fetch Data
      </button>
    </div>
  );
}
```

### Manual API Client Usage

```typescript
import { useApiClient } from './hooks/useApiClient';

function ManualApiComponent() {
  const { apiClient, isReady } = useApiClient();
  
  const makeCustomRequest = async () => {
    if (!apiClient || !isReady) return;
    
    try {
      // GET request
      const getData = await apiClient.get('https://your-api.amazonaws.com/users');
      
      // POST request
      const postData = await apiClient.post('https://your-api.amazonaws.com/users', {
        name: 'John Doe',
        email: 'john@example.com'
      });
      
      console.log('GET:', getData);
      console.log('POST:', postData);
    } catch (error) {
      console.error('Request failed:', error);
    }
  };
  
  return (
    <button onClick={makeCustomRequest} disabled={!isReady}>
      Make Custom Request
    </button>
  );
}
```

## Step 7: Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the browser and navigate to your app
3. Try logging in with a test user
4. Check the browser console for AWS credentials
5. Test API requests to your API Gateway endpoints

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Run `npm install` to install dependencies
2. **CORS errors**: Enable CORS on your API Gateway
3. **403 Forbidden**: Check IAM role permissions for the Identity Pool
4. **Credentials not found**: Verify Identity Pool configuration
5. **Invalid signature**: Ensure API Gateway uses AWS_IAM authorization

### Debug Tips

1. Check browser console for detailed error messages
2. Verify environment variables are loaded correctly
3. Test API Gateway endpoints with AWS CLI or Postman
4. Check CloudWatch logs for API Gateway and Lambda functions

## Security Considerations

1. **Never expose AWS credentials** in client-side code
2. Use **least privilege principle** for IAM roles
3. Enable **MFA** for production environments
4. Implement **proper error handling** to avoid information leakage
5. Use **HTTPS** for all API communications
6. Consider **rate limiting** on API Gateway

## Production Deployment

1. Update environment variables for production
2. Use AWS Systems Manager Parameter Store or AWS Secrets Manager for sensitive configuration
3. Enable CloudTrail for audit logging
4. Set up monitoring and alerting
5. Test the complete authentication flow

## Files Created/Modified

- `src/context/AuthContext.tsx` - Enhanced with Identity Pool integration
- `src/utils/apiClient.ts` - SigV4 signing utility
- `src/hooks/useApiClient.ts` - React hooks for API client
- `src/components/ApiExample.tsx` - Usage example component
- `.env.local` - Environment configuration
- `package.json` - Added AWS SDK dependencies

This setup provides a complete authentication flow where users authenticate with Cognito User Pool, receive temporary AWS credentials from Identity Pool, and make SigV4-signed requests to API Gateway.
