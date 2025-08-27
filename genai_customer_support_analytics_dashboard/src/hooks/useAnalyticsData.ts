import { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { Agent, Conversation, CoachingInsight, PerformanceMetrics, Transcript, TranscriptSegment, SentimentAnalysis } from '../types';

// Mock data generators for demonstration
const generateTranscriptSegments = (count: number): TranscriptSegment[] => {
  const segments: TranscriptSegment[] = [];
  let currentTime = 0;
  
  for (let i = 0; i < count; i++) {
    const isAgent = i % 2 === 0;
    const duration = faker.number.int({ min: 3, max: 15 });
    const sentimentScore = faker.number.float({ min: -1, max: 1 });
    
    segments.push({
      id: faker.string.uuid(),
      speaker: isAgent ? 'agent' : 'customer',
      text: isAgent 
        ? faker.helpers.arrayElement([
            "Thank you for calling our support center. How can I assist you today?",
            "I understand your concern. Let me look into that for you right away.",
            "I apologize for the inconvenience. Let me see what I can do to resolve this.",
            "Is there anything else I can help you with today?",
            "I've updated your account with the necessary changes."
          ])
        : faker.helpers.arrayElement([
            "Hi, I'm having trouble with my account setup.",
            "The application keeps crashing when I try to upload files.",
            "I need to change my billing information but can't find the option.",
            "Thank you so much for your help! That resolved my issue.",
            "I'm still confused about how this feature works."
          ]),
      startTime: currentTime,
      endTime: currentTime + duration,
      sentiment: sentimentScore > 0.3 ? 'positive' : sentimentScore > -0.3 ? 'neutral' : 'negative',
      sentimentScore: Number(sentimentScore.toFixed(2)),
      confidence: Number(faker.number.float({ min: 0.85, max: 0.99 }).toFixed(2))
    });
    
    currentTime += duration + faker.number.int({ min: 1, max: 3 });
  }
  
  return segments;
};

const generateSentimentAnalysis = (segments: TranscriptSegment[]): SentimentAnalysis => {
  const agentSegments = segments.filter(s => s.speaker === 'agent');
  const customerSegments = segments.filter(s => s.speaker === 'customer');
  
  const avgSentiment = segments.reduce((acc, seg) => acc + seg.sentimentScore, 0) / segments.length;
  const agentSentiment = agentSegments.reduce((acc, seg) => acc + seg.sentimentScore, 0) / agentSegments.length;
  const customerSentiment = customerSegments.reduce((acc, seg) => acc + seg.sentimentScore, 0) / customerSegments.length;
  
  return {
    overall: {
      sentiment: avgSentiment > 0.3 ? 'positive' : avgSentiment > -0.3 ? 'neutral' : 'negative',
      score: Number(avgSentiment.toFixed(2)),
      confidence: Number(faker.number.float({ min: 0.85, max: 0.95 }).toFixed(2))
    },
    agent: {
      sentiment: agentSentiment > 0.3 ? 'positive' : agentSentiment > -0.3 ? 'neutral' : 'negative',
      score: Number(agentSentiment.toFixed(2)),
      empathyScore: Number(faker.number.float({ min: 0.6, max: 0.95 }).toFixed(2)),
      professionalismScore: Number(faker.number.float({ min: 0.7, max: 0.98 }).toFixed(2))
    },
    customer: {
      sentiment: customerSentiment > 0.3 ? 'positive' : customerSentiment > -0.3 ? 'neutral' : 'negative',
      score: Number(customerSentiment.toFixed(2)),
      satisfactionIndicators: faker.helpers.arrayElements([
        'grateful', 'satisfied', 'pleased', 'happy', 'resolved'
      ], { min: 1, max: 3 }),
      frustrationIndicators: faker.helpers.arrayElements([
        'confused', 'frustrated', 'urgent', 'disappointed'
      ], { min: 0, max: 2 })
    },
    timeline: segments.map(seg => ({
      timestamp: seg.startTime,
      sentiment: seg.sentiment,
      score: seg.sentimentScore
    }))
  };
};

const generateTranscripts = (count: number): Transcript[] => {
  return Array.from({ length: count }, () => {
    const segments = generateTranscriptSegments(faker.number.int({ min: 6, max: 20 }));
    const sentimentAnalysis = generateSentimentAnalysis(segments);
    const agentTalkTime = segments.filter(s => s.speaker === 'agent').reduce((acc, s) => acc + (s.endTime - s.startTime), 0);
    const customerTalkTime = segments.filter(s => s.speaker === 'customer').reduce((acc, s) => acc + (s.endTime - s.startTime), 0);
    const totalTalkTime = agentTalkTime + customerTalkTime;
    
    return {
      id: faker.string.uuid(),
      conversationId: faker.string.uuid(),
      agentId: faker.string.uuid(),
      customerId: faker.string.uuid(),
      audioUrl: `https://example.com/audio/${faker.string.uuid()}.wav`,
      transcriptText: segments.map(s => `${s.speaker.toUpperCase()}: ${s.text}`).join('\n'),
      segments,
      sentimentAnalysis,
      keyPhrases: faker.helpers.arrayElements([
        'account setup', 'billing issue', 'technical support', 'feature request',
        'password reset', 'refund request', 'upgrade plan', 'cancel subscription'
      ], { min: 2, max: 4 }),
      talkTimeRatio: {
        agent: Number((agentTalkTime / totalTalkTime).toFixed(2)),
        customer: Number((customerTalkTime / totalTalkTime).toFixed(2))
      },
      interruptionCount: faker.number.int({ min: 0, max: 5 }),
      responseLatency: Array.from({ length: 3 }, () => faker.number.int({ min: 1, max: 8 })),
      customerRating: faker.number.int({ min: 1, max: 5 }),
      customerFeedback: faker.helpers.arrayElement([
        "Agent was very helpful and resolved my issue quickly.",
        "Good service, but took a bit longer than expected.",
        "Excellent support! Very professional and knowledgeable.",
        "Issue was resolved, but explanation could have been clearer.",
        "Outstanding service! Went above and beyond to help."
      ]),
      createdAt: faker.date.recent({ days: 7 }).toISOString(),
      processingStatus: faker.helpers.arrayElement(['processing', 'completed', 'failed']),
    };
  });
};

const generateAgents = (count: number): Agent[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${faker.string.uuid()}`,
    status: faker.helpers.arrayElement(['active', 'break', 'offline'] as const),
    activeConversations: faker.number.int({ min: 0, max: 8 }),
    performanceScore: Number(faker.number.float({ min: 3.2, max: 5.0 }).toFixed(1)),
    sentiment: Number(faker.number.float({ min: -1, max: 1 }).toFixed(2)),
    avgResponseTime: faker.number.int({ min: 30, max: 300 }),
    escalationRate: Number(faker.number.float({ min: 0.02, max: 0.15 }).toFixed(3)),
    avgCustomerRating: Number(faker.number.float({ min: 3.5, max: 5.0 }).toFixed(1)),
    totalRatings: faker.number.int({ min: 15, max: 150 })
  }));
};

const generateConversations = (count: number): Conversation[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    customerId: faker.string.uuid(),
    agentId: faker.string.uuid(),
    channel: faker.helpers.arrayElement(['chat', 'voice', 'email'] as const),
    status: faker.helpers.arrayElement(['active', 'resolved', 'escalated'] as const),
    sentiment: faker.helpers.arrayElement(['positive', 'neutral', 'negative'] as const),
    sentimentScore: Number(faker.number.float({ min: -1, max: 1 }).toFixed(2)),
    duration: faker.number.int({ min: 180, max: 3600 }),
    category: faker.helpers.arrayElement(['technical', 'billing', 'general', 'complaint', 'feature_request']),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent'] as const),
    createdAt: faker.date.recent({ days: 1 }).toISOString(),
    summary: faker.lorem.sentence(),
    upsellOpportunity: faker.datatype.boolean(),
    hasTranscript: faker.datatype.boolean(),
    customerRating: faker.number.int({ min: 1, max: 5 }),
    customerFeedback: faker.lorem.sentence()
  }));
};

const generateCoachingInsights = (count: number): CoachingInsight[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    agentId: faker.string.uuid(),
    conversationId: faker.string.uuid(),
    transcriptId: faker.string.uuid(),
    type: faker.helpers.arrayElement(['improvement', 'praise', 'training'] as const),
    category: faker.helpers.arrayElement(['tone', 'response_time', 'resolution', 'upsell', 'empathy', 'interruption', 'talk_time'] as const),
    message: faker.lorem.sentence(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high'] as const),
    createdAt: faker.date.recent({ days: 1 }).toISOString(),
    actionable: faker.datatype.boolean(),
    transcriptEvidence: {
      segmentId: faker.string.uuid(),
      text: faker.lorem.sentence(),
      timestamp: faker.number.int({ min: 10, max: 300 })
    }
  }));
};


export const useAnalyticsData = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [coachingInsights, setCoachingInsights] = useState<CoachingInsight[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls to AWS Lambda endpoints
    const fetchData = async () => {
      setLoading(true);
      
      // In real implementation, these would be actual API calls
      // await axios.get('/api/agents')
      // await axios.get('/api/conversations')
      // await axios.get('/api/coaching-insights')
      // await axios.get('/api/transcripts')
      // await axios.get('/api/metrics')
      
      setTimeout(() => {
        const mockAgents = generateAgents(12);
        const mockConversations = generateConversations(25);
        const mockCoachingInsights = generateCoachingInsights(8);
        const mockTranscripts = generateTranscripts(15);
        
        setAgents(mockAgents);
        setConversations(mockConversations);
        setCoachingInsights(mockCoachingInsights);
        setTranscripts(mockTranscripts);
        
        const avgCustomerRating = mockTranscripts.reduce((acc, t) => acc + (t.customerRating || 0), 0) / mockTranscripts.length;
        const avgTalkTimeRatio = mockTranscripts.reduce((acc, t) => acc + t.talkTimeRatio.agent, 0) / mockTranscripts.length;
        const avgInterruptionCount = mockTranscripts.reduce((acc, t) => acc + t.interruptionCount, 0) / mockTranscripts.length;
        
        setMetrics({
          totalConversations: mockConversations.length,
          avgSentimentScore: Number((mockConversations.reduce((acc, conv) => acc + conv.sentimentScore, 0) / mockConversations.length).toFixed(2)),
          resolutionRate: Number((mockConversations.filter(conv => conv.status === 'resolved').length / mockConversations.length * 100).toFixed(1)),
          avgResponseTime: Math.round(mockAgents.reduce((acc, agent) => acc + agent.avgResponseTime, 0) / mockAgents.length),
          upsellConversions: mockConversations.filter(conv => conv.upsellOpportunity).length,
          escalationRate: Number((mockConversations.filter(conv => conv.status === 'escalated').length / mockConversations.length * 100).toFixed(1)),
          activeAgents: agents.filter(agent => agent.status === 'active').length,
          coachingInsights: mockCoachingInsights.length,
          transcriptsProcessed: mockTranscripts.filter(t => t.processingStatus === 'completed').length,
          avgCustomerRating: Number(avgCustomerRating.toFixed(1)),
          avgTalkTimeRatio: Number(avgTalkTimeRatio.toFixed(2)),
          avgInterruptionCount: Number(avgInterruptionCount.toFixed(1))
        });
        
        setLoading(false);
      }, 1500);
    };

    fetchData();
  }, []);

  return {
    agents,
    conversations,
    coachingInsights,
    transcripts,
    metrics,
    loading
  };
};
