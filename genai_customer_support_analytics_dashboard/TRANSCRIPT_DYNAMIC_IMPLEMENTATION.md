# Dynamic Transcript Implementation

## Overview
All transcript components have been updated to fetch and display dynamic data from the backend API instead of using static/mock data.

## What Changed

### 1. New Service: `transcriptService.ts`
**Location:** `src/services/transcriptService.ts`

A comprehensive service that:
- Fetches all transcripts from the `/list` endpoint
- Fetches individual transcript details from `/get/parsedFiles/{key}` endpoint
- Transforms raw API data into structured `Transcript` types
- Calculates analytics dynamically:
  - Sentiment analysis (overall, agent, customer)
  - Talk time ratios
  - Interruption counts
  - Response latency
  - Empathy and professionalism scores
  - Key phrase extraction
  - Customer satisfaction indicators
- Handles audio URL fetching with pre-signed URLs
- Supports both standard and PCA (Amazon Connect Contact Lens) format

**Key Functions:**
```typescript
- fetchAllTranscripts(): Promise<Transcript[]>
- fetchTranscriptById(fileKey: string): Promise<Transcript | null>
- refreshTranscript(transcriptId: string): Promise<Transcript | null>
```

### 2. Updated: `TranscriptList.tsx`
**Location:** `src/components/Transcripts/TranscriptList.tsx`

**Dynamic Features:**
- ✅ Automatic loading from API on component mount
- ✅ Loading states with spinner
- ✅ Error handling with retry button
- ✅ Empty state handling
- ✅ Manual refresh button
- ✅ Supports both prop-based and API-based data loading
- ✅ Real-time display of:
  - Conversation metadata (ID, date, segments)
  - Agent performance (empathy, professionalism scores)
  - Interruption counts
  - Sentiment analysis with color-coded indicators
  - Customer ratings (1-5 stars)
  - Customer feedback
  - Talk time ratios with progress bar
  - Processing status badges

### 3. Updated: `TranscriptViewer.tsx`
**Location:** `src/components/Transcripts/TranscriptViewer.tsx`

**Dynamic Features:**
- ✅ Refresh button to reload transcript data
- ✅ Functional audio player with real-time controls
- ✅ Seekable progress bar
- ✅ Time tracking synchronized with audio
- ✅ Dynamic segment display with:
  - Speaker identification
  - Timestamps
  - Sentiment per segment
  - Confidence scores
- ✅ Real-time analytics panels:
  - Overall sentiment analysis
  - Agent performance metrics
  - Customer feedback with star ratings
  - Key phrases extraction
  - Satisfaction/frustration indicators

### 4. Updated: `TranscriptModal.tsx`
**Location:** `src/components/Transcripts/TranscriptModal.tsx`

**Dynamic Features:**
- ✅ Dynamic loading with proper async handling
- ✅ Enhanced error handling with retry functionality
- ✅ Loading spinner during data fetch
- ✅ Audio player integration
- ✅ Color-coded segments (agent vs customer)
- ✅ Confidence score display per segment
- ✅ Metadata display (media format, transcript URL)

## Data Flow

```
Backend API
    ↓
transcriptService.ts (data transformation & analytics)
    ↓
Components (TranscriptList, TranscriptViewer, TranscriptModal)
    ↓
User Interface (dynamic rendering)
```

## API Endpoints Used

1. **GET `/list`** - Fetch all available transcripts
2. **GET `/get/parsedFiles/{fileKey}`** - Fetch detailed transcript data
3. **GET `/presign?filename={filename}`** - Get pre-signed URLs for audio files

## Dynamic Content Now Available

### TranscriptList
1. Conversation metadata (ID, date, segment count)
2. Agent performance scores (empathy, professionalism)
3. Interruption counts
4. Sentiment analysis (positive/neutral/negative with scores and confidence)
5. Customer ratings (1-5 stars with feedback)
6. Talk time ratios (agent/customer percentages with visual bar)
7. Processing status badges

### TranscriptViewer
8. Full transcript ID
9. Audio playback with controls
10. Conversation segments with speaker, timestamps, text
11. Segment-level sentiment and confidence
12. Overall sentiment analysis
13. Agent performance details
14. Customer feedback and ratings
15. Key phrases from conversation
16. Customer satisfaction indicators
17. Customer frustration indicators

### TranscriptModal
18. File key/name
19. Dynamic audio player
20. Loading/error states
21. Transcript segments with speaker colors
22. Timestamp display
23. Confidence scores per segment
24. Media format metadata

## Analytics Calculated Dynamically

1. **Sentiment Analysis**
   - Overall conversation sentiment
   - Agent-specific sentiment
   - Customer-specific sentiment
   - Per-segment sentiment

2. **Performance Metrics**
   - Empathy score (based on agent sentiment patterns)
   - Professionalism score
   - Talk time ratios (calculated from segment durations)
   - Interruption count (speaker changes within 1 second)
   - Response latency (time gaps between customer and agent)

3. **Customer Insights**
   - Satisfaction indicators (extracted from positive sentiment)
   - Frustration indicators (extracted from negative sentiment)
   - Overall rating (1-5 scale based on sentiment)

4. **Content Analysis**
   - Key phrase extraction (from transcript text)
   - Timeline of sentiment changes
   - Conversation duration

## Error Handling

All components now include:
- Loading states with spinners
- Error states with clear messages
- Retry buttons for failed requests
- Graceful fallbacks for missing data

## Authentication

All API calls use the authenticated request hook (`useAuthenticatedRequest`) which:
- Automatically includes JWT tokens
- Falls back from SigV4 to JWT if needed
- Handles token refresh on 401/403 errors
- Provides consistent error handling

## Testing

To test the dynamic implementation:

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Navigate to Transcripts section**

3. **Verify loading states appear**

4. **Check that real data loads from API**

5. **Test refresh buttons**

6. **Try error scenarios (disconnect network, invalid auth)**

7. **Verify audio playback works**

8. **Check that all metrics calculate correctly**

## Future Enhancements

Potential improvements:
- Real-time updates via WebSocket
- Transcript search and filtering
- Export functionality
- Advanced analytics dashboard
- AI-powered coaching suggestions
- Sentiment trend visualization
- Multi-language support
- Speaker diarization improvements
