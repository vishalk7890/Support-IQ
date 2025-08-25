# AWS Amplify Deployment Guide for GenAI Customer Support Analytics Hub

## 🚀 Quick Deployment Steps

### 1. Extract and Prepare Your Project
```bash
# After downloading the zip file
unzip your-project.zip
cd your-project-folder
```

### 2. Deploy Frontend to Amplify

#### Option A: Amplify Console (Recommended)
1. **Log in to AWS Amplify Console**
   - Go to https://console.aws.amazon.com/amplify/
   - Click "Get started" under "Amplify Hosting"

2. **Deploy without Git**
   - Choose "Deploy without Git provider"
   - Upload your project zip file
   - App name: `genai-support-analytics`
   - Environment: `prod`

3. **Configure Build Settings**
   - Amplify will auto-detect React/Vite
   - Review the build settings (amplify.yml is included)
   - Click "Save and deploy"

#### Option B: Amplify CLI
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize project
amplify init

# Add hosting
amplify add hosting
# Choose: Amazon CloudFront and S3
# Choose: DEV (S3 only with HTTP)

# Publish
amplify publish
```

### 3. Set Up Backend Services

#### Create Lambda Functions
```bash
# Create a separate backend folder
mkdir genai-support-backend
cd genai-support-backend

# Initialize serverless project
npm init -y
npm install serverless serverless-offline

# Create serverless.yml and Lambda functions
```

#### API Gateway + Lambda Setup
1. **Agents API** (`/agents`)
   - GET: List all agents with performance metrics
   - POST: Update agent status

2. **Conversations API** (`/conversations`)
   - GET: Fetch real-time conversations
   - POST: Create new conversation
   - PUT: Update conversation status

3. **Coaching API** (`/coaching`)
   - GET: Fetch AI coaching insights
   - POST: Generate new coaching insights

4. **Metrics API** (`/metrics`)
   - GET: Real-time performance metrics

### 4. Configure Environment Variables in Amplify

1. **Go to Amplify Console**
   - Select your app
   - Go to "App settings" > "Environment variables"

2. **Add Required Variables**
   ```
   AWS_REGION=us-east-1
   VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
   VITE_AGENTS_ENDPOINT=/agents
   VITE_CONVERSATIONS_ENDPOINT=/conversations
   VITE_COACHING_ENDPOINT=/coaching
   VITE_METRICS_ENDPOINT=/metrics
   BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
   BEDROCK_REGION=us-east-1
   ```

### 5. Amazon Bedrock Integration

#### Enable Bedrock Models
```bash
# Request access to Claude 3 Sonnet in AWS Console
# Go to Amazon Bedrock > Model access
# Request access to Anthropic Claude models
```

#### Lambda Function for AI Analysis
```javascript
// coaching-insights-lambda.js
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  // Process conversation data and generate coaching insights
  const conversationData = JSON.parse(event.body);
  
  const prompt = `Analyze this customer support conversation and provide coaching insights:
  ${conversationData.transcript}
  
  Focus on: tone, empathy, resolution effectiveness, upsell opportunities`;

  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const response = await bedrockClient.send(command);
  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ insights: response.body })
  };
};
```

### 6. Database Setup (Optional)

#### DynamoDB Tables
```bash
# Create tables for storing data
aws dynamodb create-table \
  --table-name Agents \
  --attribute-definitions AttributeName=agentId,AttributeType=S \
  --key-schema AttributeName=agentId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws dynamodb create-table \
  --table-name Conversations \
  --attribute-definitions AttributeName=conversationId,AttributeType=S \
  --key-schema AttributeName=conversationId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 7. Real-time Features with WebSockets

#### API Gateway WebSocket
```yaml
# serverless.yml addition
functions:
  websocketConnect:
    handler: websocket.connectHandler
    events:
      - websocket: $connect
  websocketDisconnect:
    handler: websocket.disconnectHandler
    events:
      - websocket: $disconnect
  websocketMessage:
    handler: websocket.messageHandler
    events:
      - websocket: $default
```

### 8. Security & IAM Setup

#### IAM Roles for Lambda
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "*"
    }
  ]
}
```

### 9. Monitoring & Analytics

#### CloudWatch Integration
- Enable CloudWatch logs for all Lambda functions
- Set up CloudWatch alarms for performance monitoring
- Create custom metrics for conversation analytics

#### QuickSight Dashboard (Optional)
- Connect QuickSight to DynamoDB
- Create visualizations for conversation trends
- Embed QuickSight dashboard in the React app

## 🔄 Deployment Workflow

1. **Frontend Changes**: Push to Amplify (auto-deploys)
2. **Backend Changes**: Deploy Lambda functions via Serverless Framework
3. **Environment Updates**: Update variables in Amplify Console

## 📊 Architecture Overview

```
Frontend (React + Amplify) 
    ↓
API Gateway 
    ↓
Lambda Functions
    ↓
Amazon Bedrock (AI) + DynamoDB (Storage)
    ↓
CloudWatch (Monitoring)
```

## 🚨 Important Notes

- **Cost Management**: Monitor usage of Bedrock and Lambda
- **Security**: Use IAM roles, not hardcoded keys
- **Scaling**: Configure Lambda concurrency limits
- **Real-time**: Use WebSockets for live conversation updates
- **Compliance**: Ensure PII is properly anonymized before sending to Bedrock

## 🎯 Next Steps After Deployment

1. Test all API endpoints
2. Verify Bedrock integration
3. Set up monitoring alerts
4. Configure custom domain (optional)
5. Set up CI/CD pipeline for backend updates
