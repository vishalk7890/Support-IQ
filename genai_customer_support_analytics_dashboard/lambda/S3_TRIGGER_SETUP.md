# S3-Triggered Coaching Analytics Setup Guide

This setup automatically generates coaching insights when PCA creates new transcripts.

## Architecture Flow

```
PCA Step Functions → Creates transcript.json in S3 OutputBucket/parsedFiles/
                          ↓
                    S3 Event Notification
                          ↓
                    Your Coaching Lambda (triggered)
                          ↓
                    Generates insights → Stores in DynamoDB
```

---

## Step 1: Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name coaching-insights \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"createdAt-index\",
      \"KeySchema\": [{\"AttributeName\":\"createdAt\",\"KeyType\":\"HASH\"}],
      \"Projection\": {\"ProjectionType\":\"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

Or via AWS Console:
1. Go to DynamoDB → **Create table**
2. Table name: `coaching-insights`
3. Partition key: `id` (String)
4. Settings: On-demand (or Provisioned if preferred)
5. **Create table**

---

## Step 2: Create Lambda Function

### Via AWS Console:

1. **Go to Lambda** → Create function
2. **Function name**: `pca-coaching-insights-processor`
3. **Runtime**: Python 3.11
4. **Architecture**: x86_64
5. **Create function**

### Copy Code:

1. Copy content from `s3_trigger_coaching_handler.py`
2. Paste into Lambda code editor
3. **Deploy**

### Configure:

1. **Configuration** → **General configuration** → **Edit**
   - Memory: **512 MB** (or 1024 MB)
   - Timeout: **60 seconds**
   - Save

2. **Environment variables** (optional):
   - Key: `COACHING_TABLE_NAME`, Value: `coaching-insights`

---

## Step 3: Add IAM Permissions

### Option A: Attach Managed Policies (Quick)

1. Go to Lambda → **Configuration** → **Permissions**
2. Click the **Role name** (opens IAM)
3. **Add permissions** → **Attach policies**
4. Add:
   - `AmazonS3ReadOnlyAccess`
   - `AmazonDynamoDBFullAccess`

### Option B: Custom Policy (Recommended - More Secure)

Create and attach this custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::pca-outputbucket-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/coaching-insights",
        "arn:aws:dynamodb:us-east-1:*:table/coaching-insights/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## Step 4: Find Your PCA Output Bucket

```bash
# Get PCA stack outputs
aws cloudformation describe-stacks \
  --stack-name PostCallAnalytics \
  --query 'Stacks[0].Outputs[?OutputKey==`OutputBucket`].OutputValue' \
  --output text
```

Example output: `pca-outputbucket-2h6ktepwp5th`

---

## Step 5: Add S3 Event Trigger to Lambda

### Via AWS Console:

1. In Lambda function, click **Add trigger**
2. Select trigger: **S3**
3. Configure:
   - **Bucket**: Select your PCA OutputBucket (from Step 4)
   - **Event type**: `PUT` (All object create events)
   - **Prefix**: `parsedFiles/`
   - **Suffix**: `.json`
4. **Add**

### Via AWS CLI:

First, allow S3 to invoke your Lambda:

```bash
aws lambda add-permission \
  --function-name pca-coaching-insights-processor \
  --statement-id s3-trigger-permission \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::YOUR-PCA-OUTPUT-BUCKET
```

Then add S3 notification:

```bash
aws s3api put-bucket-notification-configuration \
  --bucket YOUR-PCA-OUTPUT-BUCKET \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "LambdaFunctionArn": "arn:aws:lambda:us-east-1:YOUR-ACCOUNT:function:pca-coaching-insights-processor",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {
          "Key": {
            "FilterRules": [
              {"Name": "prefix", "Value": "parsedFiles/"},
              {"Name": "suffix", "Value": ".json"}
            ]
          }
        }
      }
    ]
  }'
```

---

## Step 6: Test the Setup

### Option 1: Upload a Test Transcript

1. Create test transcript file `test-transcript.json`:

```json
{
  "ConversationAnalytics": {
    "Agent": "TestAgent",
    "Duration": 180,
    "ConversationTime": "2025-10-31T12:00:00",
    "SentimentTrends": {
      "spk_0": {
        "SentimentScore": -3.5
      },
      "spk_1": {
        "SentimentScore": 2.1
      }
    },
    "SpeakerTime": {
      "spk_0": {
        "TotalTimeSecs": 45
      },
      "spk_1": {
        "TotalTimeSecs": 120
      }
    }
  },
  "SpeechSegments": [
    {
      "SegmentSpeaker": "spk_0",
      "SegmentStartTime": 0,
      "SegmentEndTime": 5
    }
  ]
}
```

2. Upload to S3:

```bash
aws s3 cp test-transcript.json s3://YOUR-PCA-OUTPUT-BUCKET/parsedFiles/test-transcript.json
```

3. Check Lambda logs:

```bash
aws logs tail /aws/lambda/pca-coaching-insights-processor --follow
```

### Option 2: Test with Manual Event

1. In Lambda console, go to **Test** tab
2. Create test event:

```json
{
  "Records": [
    {
      "s3": {
        "bucket": {
          "name": "pca-outputbucket-2h6ktepwp5th"
        },
        "object": {
          "key": "parsedFiles/test-transcript.json"
        }
      }
    }
  ]
}
```

3. Click **Test**
4. Check execution results

---

## Step 7: Verify Insights in DynamoDB

```bash
aws dynamodb scan \
  --table-name coaching-insights \
  --max-items 5
```

Or via AWS Console:
1. Go to DynamoDB → Tables → `coaching-insights`
2. Click **Explore table items**
3. View stored insights

---

## Step 8: Query Insights from Frontend

Update your existing `coaching_analytics_handler.py` to read from DynamoDB:

```python
def lambda_handler(event, context):
    """GET /coaching-analytics - now reads from DynamoDB"""
    try:
        table = dynamodb.Table('coaching-insights')
        
        # Scan recent insights
        response = table.scan(
            Limit=100,
            ScanIndexForward=False  # Most recent first
        )
        
        insights = response.get('Items', [])
        
        # Aggregate metrics
        analytics = {
            'totalInsights': len(insights),
            'highPriorityInsights': len([i for i in insights if i.get('priority') == 'high']),
            'insights': insights[:50],
            'lastUpdated': datetime.now().isoformat()
        }
        
        return success_response(analytics)
    except Exception as e:
        return error_response(str(e))
```

---

## Monitoring & Troubleshooting

### Check Lambda Logs:
```bash
aws logs tail /aws/lambda/pca-coaching-insights-processor --follow
```

### Check S3 Event Notifications:
```bash
aws s3api get-bucket-notification-configuration \
  --bucket YOUR-PCA-OUTPUT-BUCKET
```

### Common Issues:

**❌ Lambda not triggered**
- Check S3 event notification is configured
- Verify prefix/suffix filters match `parsedFiles/*.json`
- Check Lambda permissions allow S3 invocation

**❌ Access Denied reading S3**
- Verify Lambda role has S3 read permissions
- Check bucket name is correct

**❌ DynamoDB errors**
- Verify table exists: `coaching-insights`
- Check Lambda role has DynamoDB write permissions
- Verify table schema matches

**❌ No insights generated**
- Check transcript structure matches PCA output format
- Review Lambda logs for parsing errors
- Verify sentiment thresholds in code

---

## Next Steps

1. ✅ **Set up S3 trigger** (this guide)
2. ✅ **Auto-generate insights** on every new transcript
3. 📊 **Update frontend** to display real-time insights
4. 🔔 **Add SNS notifications** for high-priority insights
5. 📈 **Create CloudWatch dashboard** for monitoring

---

## Benefits of This Approach

✅ **Real-time**: Insights generated immediately after transcription  
✅ **Scalable**: Handles multiple concurrent transcripts  
✅ **Decoupled**: No changes to PCA infrastructure  
✅ **Cost-effective**: Pay only when transcripts are created  
✅ **Extensible**: Easy to add more analysis logic

---

## Cost Estimate

- **Lambda invocations**: ~$0.20 per 1M requests
- **DynamoDB on-demand**: ~$1.25 per million writes
- **S3 events**: Free
- **Total**: ~$2-5/month for 10,000 transcripts

---

## Architecture Diagram

```
┌─────────────────┐
│  PCA Solution   │
│                 │
│  Step Functions │
└────────┬────────┘
         │ Creates transcript JSON
         ↓
┌─────────────────────────────┐
│  S3 Bucket (OutputBucket)   │
│  parsedFiles/*.json         │
└────────┬────────────────────┘
         │ S3 Event Notification
         ↓
┌─────────────────────────────┐
│  Lambda: Coaching Insights  │
│  - Analyze transcript       │
│  - Generate insights        │
└────────┬────────────────────┘
         │ Store insights
         ↓
┌─────────────────────────────┐
│  DynamoDB: coaching-insights│
└────────┬────────────────────┘
         │ Query insights
         ↓
┌─────────────────────────────┐
│  API Gateway + Frontend     │
│  Display coaching dashboard │
└─────────────────────────────┘
```

Good luck! 🚀
