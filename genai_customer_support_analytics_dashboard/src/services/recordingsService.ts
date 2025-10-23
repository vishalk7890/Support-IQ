import { useAuthenticatedRequest } from '../hooks/useApiClient';
import { useState, useCallback } from 'react';

// The base URL of the API
const API_BASE_URL = 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod';

// Interface for a transcript segment
export interface TranscriptSegment {
  id: string;
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
}

// Interface for the parsed file response
export interface ParsedFile {
  // Basic fields that might be present in the response
  id?: string;
  key?: string;
  name?: string;
  audioUrl?: string;
  
  // Transcript segments
  segments?: TranscriptSegment[];
  
  // PCA-specific fields (Amazon Connect Contact Lens)
  Recording?: {
    RecordingUrl?: string;
    MediaFormat?: string;
    Status?: string;
  };
  Transcript?: {
    TranscriptUrl?: string;
    RedactedTranscriptUrl?: string;
  };
  SpeechSegments?: any[];
  
  // Metadata fields
  contactId?: string;
  agentId?: string;
  customerId?: string;
  conversationDate?: string;
  duration?: number;
  
  // Allow any other fields
  [key: string]: any;
}

// Hook for fetching and managing recording data
export const useRecordingsService = () => {
  const { makeRequest, isReady } = useAuthenticatedRequest(API_BASE_URL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pre-signed URL for audio playback
  const getPresignedUrl = useCallback(async (filename: string): Promise<string | null> => {
    try {
      console.log(`🔗 Fetching pre-signed URL for: ${filename}`);
      const response = await makeRequest<{success: boolean, url?: string, message?: string}>(
        `/presign?filename=${encodeURIComponent(filename)}`,
        { method: 'GET' }
      );
      
      if (response.success && response.url) {
        console.log('✅ Pre-signed URL obtained');
        return response.url;
      } else {
        console.error('❌ Failed to get pre-signed URL:', response.message);
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching pre-signed URL:', err);
      return null;
    }
  }, [makeRequest]);

  // Fetch a parsed file by its key/filename
  const getParsedFile = useCallback(async (fileKey: string): Promise<ParsedFile | null> => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 Fetching parsed file: ${fileKey}`);
      
      // Make sure fileKey is properly encoded
      const encodedKey = encodeURIComponent(fileKey);
      const response = await makeRequest<ParsedFile>(`/get/parsedFiles/${encodedKey}`, {
        method: 'GET'
      });
      
      console.log('✅ Parsed file data received:', response);
      
      // Extract the audio filename from the fileKey to get pre-signed URL
      // Convert from .json to .wav (e.g., "file.wav.json" -> "file.wav")
      const audioFilename = fileKey.replace(/\.json$/, '').replace(/\.wav$/, '') + '.wav';
      console.log(`🎧 Audio filename: ${audioFilename}`);
      
      // Fetch pre-signed URL for audio playback
      const presignedUrl = await getPresignedUrl(audioFilename);
      if (presignedUrl) {
        response.audioUrl = presignedUrl;
        console.log('✅ Pre-signed audio URL added to response');
      }
      
      return response;
    } catch (err) {
      console.error('❌ Error fetching parsed file:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch parsed file');
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, getPresignedUrl]);

  // Normalize the response to a consistent format
  const normalizeResponse = useCallback((data: ParsedFile): ParsedFile => {
    // Extract audio URL from PCA response structure
    let audioUrl = data.audioUrl;
    
    // Check SourceInformation for MediaFileUri (PCA format)
    if (data.SourceInformation && Array.isArray(data.SourceInformation)) {
      const transcribeInfo = data.SourceInformation[0]?.TranscribeJobInfo;
      if (transcribeInfo?.MediaFileUri) {
        audioUrl = transcribeInfo.MediaFileUri;
      }
    }
    
    // Fallback to Recording object
    if (!audioUrl && data.Recording?.RecordingUrl) {
      audioUrl = data.Recording.RecordingUrl;
    }
    
    // Extract transcript segments from PCA SpeechSegments
    let segments: TranscriptSegment[] = [];
    
    if (data.segments && Array.isArray(data.segments)) {
      segments = data.segments;
    } else if (data.SpeechSegments && Array.isArray(data.SpeechSegments)) {
      // Convert PCA SpeechSegments to our format
      segments = data.SpeechSegments.map((segment: any, index: number) => {
        // Map speaker labels: spk_0 = Customer, spk_1 = Agent
        let speakerName = segment.SegmentSpeaker || 'unknown';
        if (speakerName === 'spk_0') speakerName = 'Customer';
        if (speakerName === 'spk_1') speakerName = 'Agent';
        
        return {
          id: `segment_${index}`,
          speaker: speakerName,
          startTime: segment.SegmentStartTime || 0,
          endTime: segment.SegmentEndTime || 0,
          text: segment.DisplayText || segment.OriginalText || '',
          sentiment: segment.SentimentIsPositive === 1 ? 'positive' : 
                     segment.SentimentIsNegative === 1 ? 'negative' : 'neutral',
          confidence: segment.WordConfidence ? 
            segment.WordConfidence.reduce((avg: number, word: any) => avg + (word.Confidence || 0), 0) / segment.WordConfidence.length
            : 1.0
        };
      });
    }
    
    // Sort segments by start time
    segments.sort((a, b) => a.startTime - b.startTime);
    
    // Return normalized data
    return {
      ...data,
      audioUrl,
      segments
    };
  }, []);

  return {
    getParsedFile,
    getPresignedUrl,
    normalizeResponse,
    loading,
    error,
    isReady
  };
};

export default useRecordingsService;
