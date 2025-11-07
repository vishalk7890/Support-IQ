# Coaching Analytics Lambda Deployment Instructions

## Step 1: Update Configuration

Open `coaching_analytics_handler.py` and update line 9:

```python
BUCKET_NAME = 'your-actual-bucket-name'  # Replace with your S3 bucket name
```

## Step 2: Create Lambda Function in AWS Console

1. **Go to AWS Lambda Console**: https://console.aws.amazon.com/lambda/

2. **Click "Create function"**

3. **Configure function:**
   - **Function name**: `coaching-analytics-handler`
   - **Runtime**: Python 3.11 (or Python 3.9+)
   - **Architecture**: x86_64
   - **Execution role**: 
     - Select "Create a new role with basic Lambda permissions"
     - Or use existing role with S3 read permissions

4. **Click "Create function"**

## Step 3: Add Code

1. **In the Lambda console**, scroll to "Code source" section

2. **Delete the default code** in `lambda_function.py`

3. **Copy and paste** the entire content from `coaching_analytics_handler.py`

4. **Click "Deploy"** button (top right of code editor)

## Step 4: Configure Lambda Settings

### Memory and Timeout:
1. Go to **Configuration** tab
2. Click **General configuration** → **Edit**
3. Set:
   - **Memory**: 512 MB (or 1024 MB for better performance)
   - **Timeout**: 30 seconds (or 60 seconds if you have many transcripts)
4. Click **Save**

### Environment Variables (Optional):
1. Go to **Configuration** tab → **Environment variables**
2. Add:
   - Key: `BUCKET_NAME`, Value: your bucket name
   - Key: `CACHE_DURATION_MINUTES`, Value: 15

## Step 5: Add S3 Permissions

1. Go to **Configuration** tab → **Permissions**

2. Click on the **Role name** (opens IAM console in new tab)

3. Click **Add permissions** → **Attach policies**

4. Search for and select:
   - `AmazonS3ReadOnlyAccess` (or create custom policy below)

5. **Custom Policy** (more secure - recommended):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

## Step 6: Test Lambda Function

1. In Lambda console, click **Test** tab

2. **Create new test event**:
   - Event name: `TestCoachingAnalytics`
   - Template: `API Gateway AWS Proxy`
   - Test event JSON:
   ```json
   {
     "httpMethod": "GET",
     "path": "/coaching-analytics",
     "headers": {
       "Authorization": "Bearer test-token"
     }
   }
   ```

3. Click **Test**

4. **Check output** - should see:
   - Status: `200`
   - Body with analytics JSON

## Step 7: Add to API Gateway

### Method 1: Using Existing API Gateway

1. **Go to API Gateway Console**: https://console.aws.amazon.com/apigateway/

2. **Select your existing API** (e.g., `Prod`)

3. **Create new resource:**
   - Click **Resources** → **Create Resource**
   - Resource path: `/coaching-analytics`
   - Click **Create**

4. **Create GET method:**
   - Select `/coaching-analytics` resource
   - Click **Create Method**
   - Method type: `GET`
   - Integration type: `Lambda function`
   - Lambda function: `coaching-analytics-handler`
   - Click **Create method**

5. **Enable CORS:**
   - Select `/coaching-analytics` resource
   - Click **Enable CORS**
   - Check all methods
   - Click **Save**

6. **Deploy API:**
   - Click **Deploy API**
   - Stage: `Prod` (or your stage name)
   - Click **Deploy**

7. **Get API URL:**
   - Go to **Stages** → `Prod`
   - Copy **Invoke URL**
   - Your endpoint will be: `{Invoke URL}/coaching-analytics`

### Method 2: Using Lambda Function URL (Simpler)

1. **In Lambda console**, go to **Configuration** tab

2. Click **Function URL** → **Create function URL**

3. **Configure:**
   - Auth type: `AWS_IAM` (for Cognito auth) or `NONE` (for testing)
   - CORS:
     - Allow origin: `*` or your domain
     - Allow methods: `GET, OPTIONS`
     - Allow headers: `*`

4. **Click "Save"**

5. **Copy Function URL** - this is your endpoint!

## Step 8: Add Authorization (if using API Gateway)

### If using Cognito User Pool Authorizer:

1. In API Gateway, select the `GET /coaching-analytics` method

2. Click **Method Request**

3. **Authorization**: Select your Cognito User Pool Authorizer

4. **Deploy API** again

## Step 9: Test from Browser

Open browser console and run:

```javascript
fetch('https://YOUR-API-URL/coaching-analytics', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('id_token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Analytics:', data));
```

## Expected Response

```json
{
  "totalInsights": 45,
  "highPriorityInsights": 12,
  "completedActionPlans": 8,
  "averageImprovementScore": 18.5,
  "topIssueCategories": [...],
  "agentPerformanceTrends": [...],
  "coachingEffectiveness": {...},
  "insights": [...],
  "totalTranscripts": 26,
  "lastUpdated": "2025-10-31T08:00:00",
  "cacheExpiry": "2025-10-31T08:15:00"
}
```

## Troubleshooting

### "Failed to access transcripts: Access Denied"
- Check S3 bucket permissions
- Verify Lambda IAM role has S3 read access

### "No transcript files found"
- Verify `BUCKET_NAME` is correct
- Check `parsedFiles/` folder exists in S3
- Confirm `.json` files are in that folder

### Lambda timeout
- Increase timeout to 60 seconds
- Increase memory to 1024 MB
- Reduce `MaxKeys` in code (line 46)

### CORS errors in browser
- Enable CORS in API Gateway
- Add proper headers in Lambda response
- Redeploy API

## Performance Tips

1. **Caching**: Function caches results for 15 minutes
2. **Limit files**: Adjust `MaxKeys` parameter (line 46) to limit processed files
3. **Memory**: Increase to 1024 MB for faster processing
4. **CloudWatch**: Monitor logs for errors

## Next Steps

Once deployed, update your frontend to use the new endpoint!

See `FRONTEND_INTEGRATION.md` for frontend code changes.
