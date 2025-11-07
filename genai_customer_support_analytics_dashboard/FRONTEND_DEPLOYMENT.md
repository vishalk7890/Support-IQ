# SupportIQ Frontend Deployment Guide

This guide covers deploying the React frontend to AWS using CloudFormation.

## 📋 What Gets Deployed

The CloudFormation stack creates:
- **S3 Bucket**: Hosts your static React files
- **CloudFront Distribution**: CDN with HTTPS
- **Origin Access Control (OAC)**: Secure S3 access
- **CloudWatch Logs**: Deployment tracking

## 🚀 Quick Start

### Prerequisites

1. AWS CLI installed and configured:
   ```bash
   aws configure
   ```

2. Permissions needed:
   - S3 (create buckets, upload files)
   - CloudFront (create distributions)
   - CloudFormation (create stacks)

### Deployment

**Option 1: Using the deploy script (recommended)**

```bash
cd genai_customer_support_analytics_dashboard
./deploy-frontend.sh
```

The script includes **automatic error handling and rollback**:
- ✅ Validates each step before proceeding
- ✅ Shows clear error messages
- ✅ Offers to automatically rollback failed deployments
- ✅ Empties S3 bucket before stack deletion
- ✅ Displays CloudFormation failure events

**Option 2: Manual deployment**

```bash
# 1. Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file cloudformation-frontend.yaml \
  --stack-name supportiq-frontend \
  --parameter-overrides EnvironmentName=production \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM

# 2. Build React app
npm run build

# 3. Get bucket name from stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name supportiq-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

# 4. Upload to S3
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# 5. Get CloudFront distribution ID
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name supportiq-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

# 6. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"
```

## 🔧 Configuration Options

Edit `deploy-frontend.sh` to customize:

```bash
# Environment (development, staging, production)
ENVIRONMENT="production"

# AWS Region
AWS_REGION="us-east-1"

# Custom domain (optional)
DOMAIN_NAME="supportiq.example.com"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:xxxxx:certificate/xxxxx"
```

## 🌐 Custom Domain Setup

To use a custom domain:

1. **Request ACM certificate** (must be in us-east-1 for CloudFront):
   ```bash
   aws acm request-certificate \
     --domain-name supportiq.example.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Validate the certificate** (follow DNS validation steps)

3. **Update deploy script** with domain and certificate ARN:
   ```bash
   DOMAIN_NAME="supportiq.example.com"
   CERTIFICATE_ARN="arn:aws:acm:us-east-1:xxxxx:certificate/xxxxx"
   ```

4. **Deploy the stack**

5. **Update DNS** - Add CNAME record:
   ```
   supportiq.example.com -> d1234567890abc.cloudfront.net
   ```

## 📊 Stack Outputs

After deployment, get your website URL:

```bash
aws cloudformation describe-stacks \
  --stack-name supportiq-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
  --output text
```

All outputs:
- `BucketName`: S3 bucket for uploads
- `CloudFrontDistributionId`: For cache invalidation
- `CloudFrontDomainName`: CloudFront domain
- `WebsiteURL`: Full website URL

## 🔄 Updating the Frontend

After making code changes:

```bash
# Build new version
npm run build

# Upload to S3
aws s3 sync dist/ s3://YOUR_BUCKET_NAME --delete

# Clear CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

Or just run:
```bash
./deploy-frontend.sh
```

## 🗑️ Cleanup / Delete Stack

To remove all resources:

```bash
# Empty the S3 bucket first
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name supportiq-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

aws s3 rm s3://$BUCKET_NAME --recursive

# Delete the stack
aws cloudformation delete-stack --stack-name supportiq-frontend
```

## 💰 Cost Estimate

Approximate monthly costs:
- **S3**: ~$0.50 (for ~1GB storage)
- **CloudFront**: ~$1-5 (depends on traffic)
- **Data Transfer**: ~$0.09/GB after first 1TB free
- **Total**: ~$2-10/month for small-medium traffic

## 🔒 Security Features

The CloudFormation template includes:
- ✅ S3 bucket with public access blocked
- ✅ CloudFront Origin Access Control (OAC)
- ✅ HTTPS redirect (HTTP → HTTPS)
- ✅ Security headers policy
- ✅ Versioning enabled on S3
- ✅ TLS 1.2+ only

## 🏗️ Architecture

```
User Browser
    ↓
CloudFront CDN (HTTPS)
    ↓
Origin Access Control
    ↓
S3 Bucket (Private)
```

## ⚠️ Important Notes

1. **CloudFront takes 5-10 minutes** to deploy initially
2. **Cache invalidation costs** $0.005 per path after first 1,000 paths/month
3. **ACM certificates** must be in `us-east-1` for CloudFront
4. **SPA routing** is handled via custom error responses (403/404 → index.html)

## ⚠️ Error Handling & Rollback

### What Happens When Deployment Fails?

The deployment script has **robust error handling**:

1. **Automatic Detection**: Script stops immediately when any step fails
2. **Error Context**: Shows which step failed and why
3. **Rollback Prompt**: Asks if you want to delete the failed stack

### Example Error Flow

```
❌ CloudFormation deployment failed
⚠️  Deployment failed. Do you want to rollback and delete the CloudFormation stack?
This will remove all created resources (S3 bucket, CloudFront distribution, etc.)
Delete stack 'supportiq-frontend'? (yes/no):
```

**Type `yes`**: Automatically cleans up all resources
- Empties S3 bucket
- Deletes CloudFormation stack
- Removes CloudFront distribution

**Type `no`**: Keeps resources for debugging
- You can inspect AWS Console
- Manually fix issues
- Re-run deployment script

### Deployment Steps with Validation

The script performs these steps with validation:

```
[1/5] Deploy CloudFormation Stack
      ✓ Validates template syntax
      ✓ Checks if stack exists (update vs create)
      ✓ Waits for stack to be ready
      ✓ Shows failure events if errors occur
      
[2/5] Build React App
      ✓ Checks package.json exists
      ✓ Runs npm install if needed
      ✓ Verifies dist/ folder created
      
[3/5] Upload to S3
      ✓ Verifies dist/ exists
      ✓ Gets bucket name from stack outputs
      ✓ Uploads with proper cache headers
      
[4/5] Invalidate CloudFront
      ✓ Gets distribution ID
      ✓ Creates invalidation (non-critical failure)
      
[5/5] Show Deployment Info
      ✓ Displays all URLs and resources
```

## 🐛 Troubleshooting

### Deployment Script Issues

#### "Permission denied: ./deploy-frontend.sh"
```bash
chmod +x deploy-frontend.sh
```

#### "AWS CLI is not installed"
Install from: https://aws.amazon.com/cli/

#### "Not authenticated to AWS"
```bash
aws configure
# Enter your Access Key, Secret Key, and Region
```

#### "Template validation failed"
- Ensure `cloudformation-frontend.yaml` exists in current directory
- Check template syntax is valid YAML

### CloudFormation Issues

#### Stack creation fails
1. Check AWS Console CloudFormation page
2. Look at "Events" tab for specific errors
3. Common causes:
   - Bucket name already exists (globally unique)
   - Missing permissions
   - Region limitations

#### Stack stuck in "CREATE_IN_PROGRESS"
- Wait for timeout (usually 60 minutes)
- Check Events tab for detailed status

#### "Stack already exists"
- Script will **update** existing stack automatically
- Safe to run multiple times

### Build Issues

#### "npm: command not found"
Install Node.js: https://nodejs.org/

#### Build fails with errors
1. Check `.env.production` file exists
2. Verify environment variables are set
3. Run `npm install` manually first
4. Check for TypeScript errors: `npm run lint`

### S3 Upload Issues

#### "Access Denied" uploading to S3
- Verify stack created successfully
- Check IAM permissions
- Ensure bucket policy allows your AWS user

#### "No such bucket"
- Wait for CloudFormation stack to complete
- Check stack status: `aws cloudformation describe-stacks --stack-name supportiq-frontend`

### CloudFront Issues

#### "403 Forbidden" from CloudFront
- Wait 5-15 minutes for CloudFront to fully deploy
- Check CloudFront distribution status in AWS Console
- Verify S3 bucket policy allows CloudFront OAC

#### React Router not working (404 errors)
- Ensure CustomErrorResponses are in CloudFormation template
- Check `ErrorDocument: index.html` is set in S3 bucket
- Verify index.html exists in S3 root

#### Changes not reflecting after deployment
- CloudFront cache may not be cleared
- Manually invalidate:
  ```bash
  aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
  ```
- Wait 5-15 minutes for invalidation to complete

### Recovery Commands

#### Check stack status
```bash
aws cloudformation describe-stacks \
  --stack-name supportiq-frontend \
  --query "Stacks[0].StackStatus"
```

#### View recent stack events
```bash
aws cloudformation describe-stack-events \
  --stack-name supportiq-frontend \
  --max-items 20
```

#### List S3 bucket contents
```bash
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name supportiq-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)
  
aws s3 ls s3://$BUCKET_NAME --recursive
```

#### Check CloudFront distribution status
```bash
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name supportiq-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)
  
aws cloudfront get-distribution --id $DIST_ID
```

## 📝 Environment Variables

Your frontend needs these environment variables for connecting to your backend:

Create `.env.production`:
```env
VITE_API_GATEWAY_URL=https://your-api.execute-api.us-east-1.amazonaws.com/Prod
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
VITE_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=us-east-1
```

These are baked into the build when you run `npm run build`.

## 🎯 Next Steps

After deployment:
1. Test your CloudFront URL
2. Set up CI/CD pipeline (GitHub Actions, CodePipeline)
3. Configure custom domain if needed
4. Set up monitoring with CloudWatch
5. Enable WAF for additional security (optional)
