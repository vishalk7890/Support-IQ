export interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'break' | 'offline';
  activeConversations: number;
  performanceScore: number;
  sentiment: number;
  avgResponseTime: number;
  escalationRate: number;
  avgCustomerRating: number;
  totalRatings: number;
}

export interface Conversation {
  id: string;
  customerId: string;
  agentId: string;
  channel: 'chat' | 'voice' | 'email';
  status: 'active' | 'resolved' | 'escalated';
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  duration: number;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  summary?: string;
  upsellOpportunity?: boolean;
  hasTranscript?: boolean;
  customerRating?: number;
  customerFeedback?: string;
}

export interface Transcript {
  id: string;
  conversationId: string;
  agentId: string;
  customerId: string;
  audioUrl?: string;
  transcriptText: string;
  segments: TranscriptSegment[];
  sentimentAnalysis: SentimentAnalysis;
  keyPhrases: string[];
  talkTimeRatio: {
    agent: number;
    customer: number;
  };
  interruptionCount: number;
  responseLatency: number[];
  customerRating?: number;
  customerFeedback?: string;
  createdAt: string;
  processingStatus: 'processing' | 'completed' | 'failed';
}

export interface TranscriptSegment {
  id: string;
  speaker: 'agent' | 'customer';
  text: string;
  startTime: number;
  endTime: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  confidence: number;
}

export interface SentimentAnalysis {
  overall: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  };
  agent: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    empathyScore: number;
    professionalismScore: number;
  };
  customer: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    satisfactionIndicators: string[];
    frustrationIndicators: string[];
  };
  timeline: {
    timestamp: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
  }[];
}

export interface CoachingInsight {
  id: string;
  agentId: string;
  conversationId: string;
  transcriptId?: string;
  type: 'improvement' | 'praise' | 'training';
  category: 'tone' | 'response_time' | 'resolution' | 'upsell' | 'empathy' | 'interruption' | 'talk_time';
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  actionable: boolean;
  transcriptEvidence?: {
    segmentId: string;
    text: string;
    timestamp: number;
  };
}

export interface PerformanceMetrics {
  totalConversations: number;
  avgSentimentScore: number;
  resolutionRate: number;
  avgResponseTime: number;
  upsellConversions: number;
  escalationRate: number;
  activeAgents: number;
  coachingInsights: number;
  transcriptsProcessed: number;
  avgCustomerRating: number;
  avgTalkTimeRatio: number;
  avgInterruptionCount: number;
}
