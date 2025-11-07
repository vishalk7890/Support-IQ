import boto3
import json
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Configuration - UPDATE THESE
COACHING_TABLE_NAME = 'coaching-insights'  # DynamoDB table for storing insights
PROCESSED_BUCKET = 'coaching-processed-transcripts'  # Optional: track processed files

def lambda_handler(event, context):
    """
    Triggered when PCA creates a new transcript JSON in S3 OutputBucket
    
    Event structure from S3:
    {
        "Records": [{
            "s3": {
                "bucket": {"name": "pca-outputbucket-xxx"},
                "object": {"key": "parsedFiles/transcript-123.json"}
            }
        }]
    }
    """
    try:
        # Process each S3 event record
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            print(f"📥 Processing new transcript: s3://{bucket}/{key}")
            
            # Only process JSON files from parsedFiles folder
            if not key.endswith('.json') or not key.startswith('parsedFiles/'):
                print(f"⏭️  Skipping non-transcript file: {key}")
                continue
            
            # Get the transcript from S3
            try:
                response = s3.get_object(Bucket=bucket, Key=key)
                transcript_data = json.loads(response['Body'].read())
            except Exception as e:
                print(f"❌ Error reading transcript from S3: {str(e)}")
                continue
            
            # Generate coaching insights
            insights = generate_coaching_insights(transcript_data, key)
            
            if insights:
                print(f"✅ Generated {len(insights)} insights for {key}")
                
                # Store insights in DynamoDB
                store_insights(insights, key)
                
                # Optional: Send notifications for high-priority insights
                high_priority = [i for i in insights if i.get('priority') == 'high']
                if high_priority:
                    print(f"🚨 Found {len(high_priority)} high-priority insights")
                    # TODO: Send SNS notification or webhook
            else:
                print(f"ℹ️  No insights generated for {key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed transcripts',
                'processed': len(event['Records'])
            })
        }
        
    except Exception as e:
        print(f"❌ Error processing S3 event: {str(e)}")
        raise


def generate_coaching_insights(transcript, file_key):
    """Generate coaching insights from transcript data"""
    insights = []
    
    # Extract conversation analytics from PCA output
    analytics = transcript.get('ConversationAnalytics', {})
    segments = transcript.get('SpeechSegments', [])
    
    if not segments:
        return insights
    
    # Extract metadata
    agent_name = analytics.get('Agent', 'Unknown')
    call_duration = analytics.get('Duration', 0)
    call_time = analytics.get('ConversationTime', datetime.now().isoformat())
    
    # Get sentiment trends
    sentiment_trends = analytics.get('SentimentTrends', {})
    
    # Analyze agent performance
    agent_sentiment = None
    customer_sentiment = None
    
    for speaker, trend_data in sentiment_trends.items():
        if 'spk_1' in speaker.lower() or 'agent' in speaker.lower():
            agent_sentiment = trend_data.get('SentimentScore', 0)
        elif 'spk_0' in speaker.lower() or 'customer' in speaker.lower():
            customer_sentiment = trend_data.get('SentimentScore', 0)
    
    # Get speaker time
    speaker_time = analytics.get('SpeakerTime', {})
    
    # Insight 1: Poor customer sentiment
    if customer_sentiment is not None and customer_sentiment < -2.0:
        insights.append({
            'id': f"insight_{file_key.replace('/', '_')}_empathy_{int(datetime.now().timestamp())}",
            'transcriptId': file_key,
            'transcriptFileName': file_key.split('/')[-1],
            'agentName': agent_name,
            'callTime': call_time,
            'type': 'improvement',
            'category': 'empathy',
            'title': 'Low Customer Satisfaction Detected',
            'message': f'Customer showed negative sentiment (score: {customer_sentiment:.2f}). Review call for empathy opportunities.',
            'priority': 'high',
            'aiConfidence': 0.89,
            'impactLevel': 'high',
            'suggestedActions': [
                'Practice active listening and acknowledgment',
                'Use empathy phrases: "I understand how frustrating this is"',
                'Validate customer emotions before problem-solving',
                'Review call recording for tone and pacing'
            ],
            'metrics': {
                'customerSentiment': customer_sentiment,
                'callDuration': call_duration
            },
            'createdAt': datetime.now().isoformat(),
            'status': 'pending'
        })
    
    # Insight 2: Excellent customer experience
    if customer_sentiment is not None and customer_sentiment > 3.0:
        insights.append({
            'id': f"insight_{file_key.replace('/', '_')}_praise_{int(datetime.now().timestamp())}",
            'transcriptId': file_key,
            'transcriptFileName': file_key.split('/')[-1],
            'agentName': agent_name,
            'callTime': call_time,
            'type': 'praise',
            'category': 'customer_satisfaction',
            'title': 'Outstanding Customer Satisfaction',
            'message': f'Excellent customer sentiment (score: {customer_sentiment:.2f})! Great job maintaining positive rapport.',
            'priority': 'low',
            'aiConfidence': 0.95,
            'impactLevel': 'low',
            'suggestedActions': [
                'Share best practices with team',
                'Document techniques used in this call',
                'Consider for agent recognition program',
                'Use as training example'
            ],
            'metrics': {
                'customerSentiment': customer_sentiment,
                'callDuration': call_duration
            },
            'createdAt': datetime.now().isoformat(),
            'status': 'completed'
        })
    
    # Insight 3: Talk time imbalance
    agent_talk_time = None
    customer_talk_time = None
    
    for speaker, time_data in speaker_time.items():
        if 'spk_1' in speaker.lower() or 'agent' in speaker.lower():
            agent_talk_time = time_data.get('TotalTimeSecs', 0)
        elif 'spk_0' in speaker.lower() or 'customer' in speaker.lower():
            customer_talk_time = time_data.get('TotalTimeSecs', 0)
    
    if agent_talk_time and customer_talk_time:
        total_talk = agent_talk_time + customer_talk_time
        if total_talk > 0:
            agent_ratio = agent_talk_time / total_talk
            
            if agent_ratio > 0.7:
                insights.append({
                    'id': f"insight_{file_key.replace('/', '_')}_talktime_{int(datetime.now().timestamp())}",
                    'transcriptId': file_key,
                    'transcriptFileName': file_key.split('/')[-1],
                    'agentName': agent_name,
                    'callTime': call_time,
                    'type': 'improvement',
                    'category': 'active_listening',
                    'title': 'High Agent Talk Time Ratio',
                    'message': f'Agent spoke {agent_ratio*100:.1f}% of the time. Consider asking more open-ended questions.',
                    'priority': 'medium',
                    'aiConfidence': 0.87,
                    'impactLevel': 'medium',
                    'suggestedActions': [
                        'Use open-ended questions to encourage customer input',
                        'Practice strategic silence after questions',
                        'Avoid over-explaining - check for understanding instead',
                        'Balance information-giving with active listening'
                    ],
                    'metrics': {
                        'agentTalkTime': agent_talk_time,
                        'customerTalkTime': customer_talk_time,
                        'agentTalkRatio': agent_ratio
                    },
                    'createdAt': datetime.now().isoformat(),
                    'status': 'pending'
                })
    
    # Insight 4: Categories detected (from Transcribe Call Analytics)
    categories_detected = analytics.get('CategoriesDetected', [])
    if categories_detected:
        for category in categories_detected[:3]:  # Top 3 categories
            category_name = category.get('Name', 'Unknown')
            instances = category.get('Instances', 0)
            
            insights.append({
                'id': f"insight_{file_key.replace('/', '_')}_category_{category_name}_{int(datetime.now().timestamp())}",
                'transcriptId': file_key,
                'transcriptFileName': file_key.split('/')[-1],
                'agentName': agent_name,
                'callTime': call_time,
                'type': 'observation',
                'category': 'call_analytics',
                'title': f'Category Detected: {category_name}',
                'message': f'Call matched category "{category_name}" ({instances} instances). Review for compliance/quality.',
                'priority': 'medium',
                'aiConfidence': 0.92,
                'impactLevel': 'medium',
                'suggestedActions': [
                    f'Review category rules for {category_name}',
                    'Check if handling was appropriate',
                    'Update knowledge base if needed',
                    'Monitor trend across similar calls'
                ],
                'metrics': {
                    'categoryName': category_name,
                    'instances': instances
                },
                'createdAt': datetime.now().isoformat(),
                'status': 'pending'
            })
    
    # Insight 5: Issues detected
    issues_detected = analytics.get('IssuesDetected', [])
    if issues_detected:
        for issue in issues_detected[:2]:  # Top 2 issues
            insights.append({
                'id': f"insight_{file_key.replace('/', '_')}_issue_{int(datetime.now().timestamp())}",
                'transcriptId': file_key,
                'transcriptFileName': file_key.split('/')[-1],
                'agentName': agent_name,
                'callTime': call_time,
                'type': 'training',
                'category': 'issue_resolution',
                'title': f'Issue Detected: {issue.get("Text", "Unknown issue")}',
                'message': f'Transcribe detected a customer issue. Review resolution approach.',
                'priority': 'high',
                'aiConfidence': 0.91,
                'impactLevel': 'high',
                'suggestedActions': [
                    'Review issue resolution process',
                    'Check if escalation was needed',
                    'Update troubleshooting guides',
                    'Consider additional training on this issue type'
                ],
                'metrics': {
                    'issueText': issue.get('Text', '')
                },
                'createdAt': datetime.now().isoformat(),
                'status': 'pending'
            })
    
    return insights


def store_insights(insights, transcript_key):
    """Store insights in DynamoDB"""
    try:
        table = dynamodb.Table(COACHING_TABLE_NAME)
        
        for insight in insights:
            table.put_item(Item=insight)
            print(f"✅ Stored insight: {insight['id']}")
        
        return True
    except Exception as e:
        print(f"❌ Error storing insights in DynamoDB: {str(e)}")
        # Don't raise - we don't want to fail the whole process
        return False


def send_notification(insights):
    """Send notification for high-priority insights (optional)"""
    # TODO: Implement SNS, SES, or webhook notification
    pass
