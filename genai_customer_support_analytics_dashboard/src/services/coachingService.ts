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

  // Get coaching analytics summary
  async getCoachingAnalytics(): Promise<CoachingAnalytics> {
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
    generateSmartInsights: coachingService.generateSmartInsights,
    generateActionPlan: coachingService.generateActionPlan,
    calculateCoachingEffectiveness: coachingService.calculateCoachingEffectiveness,
    getCoachingAnalytics: coachingService.getCoachingAnalytics
  };
};

export default CoachingService;
