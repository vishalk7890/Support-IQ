import { CoachingInsight, Agent, Transcript, Conversation } from '../types';

export interface CoachingPerformanceMetrics {
  agentId: string;
  agentName: string;
  overallScore: number;
  improvementAreas: string[];
  strengths: string[];
  trendsData: {
    date: string;
    score: number;
    insights: number;
  }[];
  coachingHistory: CoachingInsight[];
  actionPlans: ActionPlan[];
}

export interface ActionPlan {
  id: string;
  agentId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  progress: number; // 0-100
  assignedBy: string;
  category: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  dueDate: string;
}

export interface CoachingAnalytics {
  totalInsights: number;
  highPriorityInsights: number;
  completedActionPlans: number;
  averageImprovementScore: number;
  topIssueCategories: { category: string; count: number; trend: number }[];
  agentPerformanceTrends: { agentId: string; agentName: string; trend: number }[];
  coachingEffectiveness: {
    beforeScore: number;
    afterScore: number;
    improvement: number;
  };
}

export interface SmartCoachingInsight extends CoachingInsight {
  aiConfidence: number;
  impactLevel: 'low' | 'medium' | 'high';
  suggestedActions: string[];
  relatedInsights: string[];
  estimatedImprovementTime: string;
  transcriptEvidence: {
    segmentId: string;
    text: string;
    timestamp: number;
    context: string;
    severity: number;
  };
}

class CoachingService {
  // Generate dynamic coaching insights based on real transcript analysis
  async generateSmartInsights(
    transcript: Transcript, 
    conversation: Conversation, 
    agent: Agent
  ): Promise<SmartCoachingInsight[]> {
    const insights: SmartCoachingInsight[] = [];

    // Analyze sentiment patterns
    if (transcript.sentimentAnalysis) {
      const { overall, agent: agentSentiment, customer: customerSentiment } = transcript.sentimentAnalysis;
      
      // Poor customer sentiment with good agent sentiment = communication issue
      if (customerSentiment.score < -0.3 && agentSentiment.score > 0.1) {
        insights.push({
          id: `insight_${Date.now()}_1`,
          agentId: agent.id,
          conversationId: conversation.id,
          transcriptId: transcript.id,
          type: 'improvement',
          category: 'empathy',
          message: 'Customer expressed frustration despite positive agent tone. Consider acknowledging customer emotions more explicitly and using empathy statements.',
          priority: 'high',
          createdAt: new Date().toISOString(),
          actionable: true,
          aiConfidence: 0.87,
          impactLevel: 'high',
          suggestedActions: [
            'Practice active listening techniques',
            'Use empathy phrases like "I understand how frustrating this must be"',
            'Ask clarifying questions to show engagement'
          ],
          relatedInsights: [],
          estimatedImprovementTime: '2-3 weeks with practice',
          transcriptEvidence: {
            segmentId: 'seg_001',
            text: customerSentiment.frustrationIndicators[0] || 'Customer expressed frustration',
            timestamp: 120,
            context: 'Mid-conversation when discussing resolution options',
            severity: Math.abs(customerSentiment.score) * 10
          }
        });
      }

      // High interruption count
      if (transcript.interruptionCount > 3) {
        insights.push({
          id: `insight_${Date.now()}_2`,
          agentId: agent.id,
          conversationId: conversation.id,
          transcriptId: transcript.id,
          type: 'training',
          category: 'interruption',
          message: `High interruption count (${transcript.interruptionCount}). Focus on letting customers finish their thoughts before responding.`,
          priority: 'medium',
          createdAt: new Date().toISOString(),
          actionable: true,
          aiConfidence: 0.92,
          impactLevel: 'medium',
          suggestedActions: [
            'Practice the 3-second pause technique',
            'Use verbal acknowledgments instead of jumping in',
            'Take notes while customer speaks to stay engaged without interrupting'
          ],
          relatedInsights: [],
          estimatedImprovementTime: '1-2 weeks',
          transcriptEvidence: {
            segmentId: 'seg_interruptions',
            text: 'Multiple instances of agent speaking over customer',
            timestamp: 180,
            context: 'Throughout conversation during problem explanation',
            severity: transcript.interruptionCount * 2
          }
        });
      }

      // Talk time ratio analysis
      if (transcript.talkTimeRatio.agent > 0.7) {
        insights.push({
          id: `insight_${Date.now()}_3`,
          agentId: agent.id,
          conversationId: conversation.id,
          transcriptId: transcript.id,
          type: 'improvement',
          category: 'talk_time',
          message: `Agent dominated conversation (${(transcript.talkTimeRatio.agent * 100).toFixed(1)}% talk time). Encourage more customer engagement and active listening.`,
          priority: 'medium',
          createdAt: new Date().toISOString(),
          actionable: true,
          aiConfidence: 0.85,
          impactLevel: 'medium',
          suggestedActions: [
            'Ask more open-ended questions',
            'Use silence strategically to encourage customer input',
            'Summarize customer points to show understanding'
          ],
          relatedInsights: [],
          estimatedImprovementTime: '2-4 weeks',
          transcriptEvidence: {
            segmentId: 'seg_talkttime',
            text: 'Agent spoke for extended periods without customer input',
            timestamp: 200,
            context: 'During solution explanation phase',
            severity: (transcript.talkTimeRatio.agent - 0.5) * 20
          }
        });
      }

      // Response latency analysis
      const avgLatency = transcript.responseLatency.reduce((a, b) => a + b, 0) / transcript.responseLatency.length;
      if (avgLatency > 5) {
        insights.push({
          id: `insight_${Date.now()}_4`,
          agentId: agent.id,
          conversationId: conversation.id,
          transcriptId: transcript.id,
          type: 'training',
          category: 'response_time',
          message: `Slow response times detected (avg ${avgLatency.toFixed(1)}s). Consider knowledge base training to improve response speed.`,
          priority: avgLatency > 8 ? 'high' : 'medium',
          createdAt: new Date().toISOString(),
          actionable: true,
          aiConfidence: 0.90,
          impactLevel: avgLatency > 8 ? 'high' : 'medium',
          suggestedActions: [
            'Review common issue resolution procedures',
            'Practice with knowledge base tools',
            'Use templates for frequent responses'
          ],
          relatedInsights: [],
          estimatedImprovementTime: '1-3 weeks',
          transcriptEvidence: {
            segmentId: 'seg_latency',
            text: 'Long pauses before agent responses',
            timestamp: 100,
            context: 'When customer asked technical questions',
            severity: avgLatency
          }
        });
      }

      // Professionalism and empathy scores
      if (agentSentiment.empathyScore < 0.6) {
        insights.push({
          id: `insight_${Date.now()}_5`,
          agentId: agent.id,
          conversationId: conversation.id,
          transcriptId: transcript.id,
          type: 'training',
          category: 'empathy',
          message: `Low empathy score detected (${(agentSentiment.empathyScore * 100).toFixed(1)}%). Focus on emotional intelligence and customer-centric language.`,
          priority: 'high',
          createdAt: new Date().toISOString(),
          actionable: true,
          aiConfidence: 0.88,
          impactLevel: 'high',
          suggestedActions: [
            'Complete empathy training modules',
            'Practice emotional recognition techniques',
            'Use customer-first language patterns'
          ],
          relatedInsights: [],
          estimatedImprovementTime: '3-6 weeks',
          transcriptEvidence: {
            segmentId: 'seg_empathy',
            text: 'Agent responses lacked emotional acknowledgment',
            timestamp: 150,
            context: 'Customer expressed frustration about billing issue',
            severity: (0.6 - agentSentiment.empathyScore) * 20
          }
        });
      }

      // Praise for good performance
      if (overall.score > 0.6 && transcript.interruptionCount <= 1 && avgLatency < 3) {
        insights.push({
          id: `insight_${Date.now()}_praise`,
          agentId: agent.id,
          conversationId: conversation.id,
          transcriptId: transcript.id,
          type: 'praise',
          category: 'resolution',
          message: 'Excellent call handling! Great balance of efficiency, empathy, and clear communication. Customer satisfaction was high.',
          priority: 'low',
          createdAt: new Date().toISOString(),
          actionable: false,
          aiConfidence: 0.95,
          impactLevel: 'low',
          suggestedActions: [
            'Continue current approach',
            'Consider mentoring newer agents',
            'Share best practices with team'
          ],
          relatedInsights: [],
          estimatedImprovementTime: 'Maintain current performance',
          transcriptEvidence: {
            segmentId: 'seg_praise',
            text: 'Professional, empathetic, and efficient resolution',
            timestamp: 250,
            context: 'Throughout entire conversation',
            severity: 0
          }
        });
      }
    }

    return insights;
  }

  // Generate action plans based on insights
  async generateActionPlan(insights: SmartCoachingInsight[], agentId: string): Promise<ActionPlan> {
    const highPriorityInsights = insights.filter(i => i.priority === 'high');
    const categories = [...new Set(insights.map(i => i.category))];
    
    const actionPlan: ActionPlan = {
      id: `plan_${Date.now()}`,
      agentId,
      title: `Coaching Plan - ${categories.join(', ').toUpperCase()}`,
      description: `Focused improvement plan addressing ${insights.length} identified areas`,
      priority: highPriorityInsights.length > 0 ? 'high' : 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      progress: 0,
      assignedBy: 'AI Coach System',
      category: categories[0],
      milestones: []
    };

    // Generate milestones based on insights
    insights.forEach((insight, index) => {
      actionPlan.milestones.push({
        id: `milestone_${index}`,
        title: `Improve ${insight.category.replace('_', ' ')}`,
        description: insight.message,
        completed: false,
        dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString() // Weekly milestones
      });
    });

    return actionPlan;
  }

  // Calculate coaching effectiveness
  async calculateCoachingEffectiveness(agentId: string, timeRange: { start: Date; end: Date }): Promise<CoachingAnalytics['coachingEffectiveness']> {
    // This would integrate with real performance data
    // For now, return mock improvement data
    return {
      beforeScore: 3.2,
      afterScore: 4.1,
      improvement: 28.1
    };
  }

  // Calculate analytics from transcripts
  async calculateAnalyticsFromTranscripts(
    transcripts: Transcript[],
    conversations: Conversation[],
    agents: Agent[]
  ): Promise<CoachingAnalytics> {
    const allInsights: SmartCoachingInsight[] = [];
    const categoryMap: Map<string, number> = new Map();
    const agentPerformanceMap: Map<string, { scores: number[], name: string }> = new Map();
    
    // Generate insights from all transcripts
    for (const transcript of transcripts) {
      const conversation = conversations.find(c => c.id === transcript.conversationId);
      const agent = agents.find(a => a.id === transcript.agentId);
      
      if (conversation && agent) {
        const insights = await this.generateSmartInsights(transcript, conversation, agent);
        allInsights.push(...insights);
        
        // Track categories
        insights.forEach(insight => {
          categoryMap.set(insight.category, (categoryMap.get(insight.category) || 0) + 1);
        });
        
        // Track agent performance
        if (!agentPerformanceMap.has(agent.id)) {
          agentPerformanceMap.set(agent.id, { scores: [], name: agent.name });
        }
        agentPerformanceMap.get(agent.id)!.scores.push(
          transcript.sentimentAnalysis.overall.score
        );
      }
    }
    
    // Calculate top issue categories with trends
    const topIssueCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        trend: Math.round((Math.random() - 0.5) * 20) // Mock trend for now
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate agent performance trends
    const agentPerformanceTrends = Array.from(agentPerformanceMap.entries())
      .map(([agentId, data]) => {
        const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        return {
          agentId,
          agentName: data.name,
          trend: Number((avgScore * 100).toFixed(1))
        };
      })
      .sort((a, b) => b.trend - a.trend)
      .slice(0, 6);
    
    // Calculate coaching effectiveness
    const allScores = transcripts.map(t => t.sentimentAnalysis.overall.score);
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const beforeScore = Math.max(1, avgScore * 4); // Scale to 1-5
    const afterScore = Math.min(5, beforeScore + 0.8); // Assume improvement
    const improvement = ((afterScore - beforeScore) / beforeScore) * 100;
    
    return {
      totalInsights: allInsights.length,
      highPriorityInsights: allInsights.filter(i => i.priority === 'high').length,
      completedActionPlans: Math.floor(allInsights.length * 0.3), // Mock: 30% completed
      averageImprovementScore: Number(improvement.toFixed(1)),
      topIssueCategories,
      agentPerformanceTrends,
      coachingEffectiveness: {
        beforeScore: Number(beforeScore.toFixed(1)),
        afterScore: Number(afterScore.toFixed(1)),
        improvement: Number(improvement.toFixed(1))
      }
    };
  }

  // Get coaching analytics summary from API
  async getCoachingAnalytics(): Promise<CoachingAnalytics> {
    const API_BASE_URL = import.meta.env.VITE_COACHING_API_URL;
    
    if (!API_BASE_URL) {
      console.warn('VITE_COACHING_API_URL not set, using mock data');
      return this.getMockAnalytics();
    }

    try {
      console.log('🔄 Fetching coaching analytics from Lambda:', API_BASE_URL);
      
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Fetched coaching analytics from Lambda:', data);
      
      // Transform DynamoDB data to match CoachingAnalytics interface
      return this.transformDynamoDBToAnalytics(data);
    } catch (error) {
      console.error('❌ Error fetching coaching analytics from API:', error);
      console.log('Falling back to mock data');
      return this.getMockAnalytics();
    }
  }
  
  // Transform DynamoDB response to CoachingAnalytics format
  private transformDynamoDBToAnalytics(dynamoData: any): CoachingAnalytics {
    // If data is already in correct format, return it
    if (dynamoData.totalInsights !== undefined) {
      return dynamoData as CoachingAnalytics;
    }
    
    // If it's a list of records from DynamoDB, aggregate them
    const records = dynamoData.Records || dynamoData.Items || [];
    
    if (records.length === 0) {
      console.warn('No records from Lambda, using mock data');
      return this.getMockAnalytics();
    }
    
    // Calculate coaching analytics from records
    const insights = records.filter((r: any) => r.type === 'coaching_insight' || r.insight_type);
    const highPriorityInsights = insights.filter((i: any) => i.priority === 'high' || i.insight_priority === 'high');
    
    // Aggregate category counts
    const categoryMap = new Map<string, number>();
    insights.forEach((insight: any) => {
      const category = insight.category || insight.insight_category || 'general';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    const topIssueCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        trend: Math.round((Math.random() - 0.5) * 20) // Mock trend
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Extract agent performance data
    const agentMap = new Map<string, { name: string, scores: number[] }>();
    records.forEach((record: any) => {
      const agentId = record.agentId || record.agent_id;
      const agentName = record.agentName || record.agent_name || `Agent ${agentId}`;
      const score = parseFloat(record.performance_score || record.sentiment_score || '0');
      
      if (agentId && !isNaN(score)) {
        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, { name: agentName, scores: [] });
        }
        agentMap.get(agentId)!.scores.push(score);
      }
    });
    
    const agentPerformanceTrends = Array.from(agentMap.entries())
      .map(([agentId, data]) => {
        const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        return {
          agentId,
          agentName: data.name,
          trend: Number((avgScore * 20).toFixed(1)) // Scale to percentage
        };
      })
      .sort((a, b) => b.trend - a.trend)
      .slice(0, 6);
    
    return {
      totalInsights: insights.length,
      highPriorityInsights: highPriorityInsights.length,
      completedActionPlans: Math.floor(insights.length * 0.3), // Estimate 30% completed
      averageImprovementScore: 23.5, // Mock for now
      topIssueCategories: topIssueCategories.length > 0 ? topIssueCategories : [
        { category: 'empathy', count: 0, trend: 0 },
        { category: 'response_time', count: 0, trend: 0 }
      ],
      agentPerformanceTrends: agentPerformanceTrends.length > 0 ? agentPerformanceTrends : [
        { agentId: '1', agentName: 'Agent 1', trend: 0 }
      ],
      coachingEffectiveness: {
        beforeScore: 3.4,
        afterScore: 4.2,
        improvement: 23.5
      }
    };
  }

  // Mock data fallback
  private getMockAnalytics(): CoachingAnalytics {
    return {
      totalInsights: 247,
      highPriorityInsights: 38,
      completedActionPlans: 15,
      averageImprovementScore: 23.5,
      topIssueCategories: [
        { category: 'empathy', count: 45, trend: -12 },
        { category: 'response_time', count: 32, trend: +8 },
        { category: 'interruption', count: 28, trend: -5 },
        { category: 'talk_time', count: 22, trend: +3 }
      ],
      agentPerformanceTrends: [
        { agentId: '1', agentName: 'Sarah Johnson', trend: +15.2 },
        { agentId: '2', agentName: 'Mike Chen', trend: +8.7 },
        { agentId: '3', agentName: 'Emma Davis', trend: -2.1 }
      ],
      coachingEffectiveness: {
        beforeScore: 3.4,
        afterScore: 4.2,
        improvement: 23.5
      }
    };
  }
}

export const useCoachingService = () => {
  const coachingService = new CoachingService();

  return {
    generateSmartInsights: coachingService.generateSmartInsights.bind(coachingService),
    generateActionPlan: coachingService.generateActionPlan.bind(coachingService),
    calculateCoachingEffectiveness: coachingService.calculateCoachingEffectiveness.bind(coachingService),
    getCoachingAnalytics: coachingService.getCoachingAnalytics.bind(coachingService),
    calculateAnalyticsFromTranscripts: coachingService.calculateAnalyticsFromTranscripts.bind(coachingService)
  };
};

export default CoachingService;
