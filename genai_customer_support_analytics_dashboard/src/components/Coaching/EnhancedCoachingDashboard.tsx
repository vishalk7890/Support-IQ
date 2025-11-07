import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  MessageSquare,
  Star,
  ArrowRight,
  Eye,
  Play,
  Pause,
  MoreVertical,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Settings
} from 'lucide-react';
import { useCoachingService, CoachingAnalytics, ActionPlan, SmartCoachingInsight } from '../../services/coachingService';
import { useTranscriptService } from '../../services/transcriptService';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';

interface EnhancedCoachingDashboardProps {
  onNavigate?: (tab: string) => void;
}

const EnhancedCoachingDashboard: React.FC<EnhancedCoachingDashboardProps> = ({ onNavigate }) => {
  const { calculateAnalyticsFromTranscripts } = useCoachingService();
  const { fetchAllTranscripts } = useTranscriptService();
  const { agents, conversations } = useAnalyticsData();
  
  const [analytics, setAnalytics] = useState<CoachingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'action-plans' | 'agents'>('overview');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1w' | '1m' | '3m' | '6m'>('1m');
  const [smartInsights, setSmartInsights] = useState<SmartCoachingInsight[]>([]);

  // Fallback mock data if no insights from API
  const mockInsights = React.useMemo<SmartCoachingInsight[]>(() => [
    {
      id: '1',
      agentId: 'agent_001',
      conversationId: 'conv_001',
      transcriptId: 'trans_001',
      type: 'improvement',
      category: 'empathy',
      message: 'Customer expressed frustration but agent didn\'t acknowledge emotions. Practice empathy statements like "I understand how frustrating this must be for you."',
      priority: 'high',
      createdAt: new Date().toISOString(),
      actionable: true,
      aiConfidence: 0.92,
      impactLevel: 'high',
      suggestedActions: [
        'Use empathy phrases in next 5 interactions',
        'Complete emotional intelligence training module',
        'Practice active listening exercises'
      ],
      relatedInsights: ['insight_002', 'insight_003'],
      estimatedImprovementTime: '2-3 weeks',
      transcriptEvidence: {
        segmentId: 'seg_001',
        text: 'Customer: "This is so frustrating, I\'ve been trying to resolve this for hours!" Agent: "Let me check your account details."',
        timestamp: 145,
        context: 'Customer expressing frustration about billing issue',
        severity: 8.5
      }
    },
    {
      id: '2',
      agentId: 'agent_002',
      conversationId: 'conv_002',
      type: 'praise',
      category: 'resolution',
      message: 'Excellent problem-solving approach! You identified the root cause quickly and provided clear step-by-step resolution.',
      priority: 'low',
      createdAt: new Date().toISOString(),
      actionable: false,
      aiConfidence: 0.98,
      impactLevel: 'low',
      suggestedActions: [
        'Share approach with team during next meeting',
        'Consider mentoring newer agents',
        'Document best practice for knowledge base'
      ],
      relatedInsights: [],
      estimatedImprovementTime: 'Maintain performance',
      transcriptEvidence: {
        segmentId: 'seg_002',
        text: 'Systematic troubleshooting and clear explanation provided',
        timestamp: 320,
        context: 'Technical issue resolution',
        severity: 0
      }
    }
  ], []);

  const [actionPlans] = useState<ActionPlan[]>([
    {
      id: 'plan_001',
      agentId: 'agent_001',
      title: 'Empathy & Communication Enhancement',
      description: 'Focus on emotional intelligence and customer empathy in interactions',
      priority: 'high',
      status: 'in_progress',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 35,
      assignedBy: 'Sarah Manager',
      category: 'empathy',
      milestones: [
        {
          id: 'milestone_1',
          title: 'Complete Empathy Training Module',
          description: 'Finish online empathy training course',
          completed: true,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'milestone_2',
          title: 'Practice Empathy Statements',
          description: 'Use empathy phrases in next 10 customer interactions',
          completed: false,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  ]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching coaching analytics from API...');
      
      // Fetch real data from Lambda/DynamoDB
      const coachingService = new (await import('../../services/coachingService')).default();
      const analyticsData = await coachingService.getCoachingAnalytics();
      
      setAnalytics(analyticsData);
      
      // Update smart insights from API
      if ((analyticsData as any).insights && Array.isArray((analyticsData as any).insights)) {
        const apiInsights = (analyticsData as any).insights.map((insight: any) => ({
          ...insight,
          aiConfidence: insight.aiConfidence || 0.85,
          impactLevel: insight.impactLevel || 'medium',
          suggestedActions: insight.suggestedActions || [],
          relatedInsights: insight.relatedInsights || [],
          estimatedImprovementTime: insight.estimatedImprovementTime || '2-3 weeks',
          transcriptEvidence: insight.transcriptEvidence || {
            segmentId: 'seg_001',
            text: insight.message || 'Evidence from transcript',
            timestamp: 120,
            context: 'Call context',
            severity: 5
          }
        }));
        setSmartInsights(apiInsights);
        console.log(`✅ Loaded ${apiInsights.length} smart insights from API`);
      } else {
        // Use mock data if no insights from API
        setSmartInsights(mockInsights);
        console.log('⚠️ No insights from API, using mock data');
      }
      
      console.log('✅ Coaching analytics loaded from API');
    } catch (error) {
      console.error('❌ Error fetching coaching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load coaching analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch data on mount and when timeRange changes
    fetchAnalytics();
  }, [timeRange, fetchAnalytics]); // Re-run when timeRange changes

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Insights</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.totalInsights}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-600 font-medium">+12% vs last month</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.highPriorityInsights}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-600 font-medium">Needs attention</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Action Plans</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.completedActionPlans}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-600 font-medium">Completed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Improvement</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.averageImprovementScore}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-600 font-medium">Performance gain</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coaching Effectiveness */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Coaching Effectiveness
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Before Coaching</span>
              <span className="text-lg font-bold text-gray-400">{analytics?.coachingEffectiveness.beforeScore}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${(analytics?.coachingEffectiveness.beforeScore || 0) * 20}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">After Coaching</span>
              <span className="text-lg font-bold text-green-600">{analytics?.coachingEffectiveness.afterScore}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(analytics?.coachingEffectiveness.afterScore || 0) * 20}%` }}
              ></div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-green-800">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {analytics?.coachingEffectiveness.improvement}% Overall Improvement
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Issue Categories */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Top Issue Categories
          </h3>
          <div className="space-y-3">
            {analytics?.topIssueCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-red-500' : 
                    index === 1 ? 'bg-orange-500' : 
                    index === 2 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {category.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{category.count}</span>
                  <div className={`flex items-center gap-1 text-xs ${
                    category.trend > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {category.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(category.trend)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance Trends */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-600" />
          Agent Performance Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics?.agentPerformanceTrends.map((agent) => (
            <div key={agent.agentId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{agent.agentName}</span>
                <div className={`flex items-center gap-1 text-sm ${
                  agent.trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {agent.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(agent.trend)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${agent.trend > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(agent.trend) * 5, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Smart Coaching Insights</h2>
        <div className="flex items-center gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>All Priorities</option>
            <option>High Priority</option>
            <option>Medium Priority</option>
            <option>Low Priority</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {smartInsights.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <Brain className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No coaching insights available yet.</p>
            <p className="text-sm text-gray-400 mt-1">Insights will appear here after processing call transcripts.</p>
          </div>
        ) : (
          smartInsights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl p-6 border-l-4 shadow-sm ${
              insight.priority === 'high' ? 'border-red-500' :
              insight.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-full ${
                    insight.type === 'praise' ? 'bg-green-100' :
                    insight.type === 'improvement' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    {insight.type === 'praise' ? (
                      <Award className={`w-4 h-4 ${
                        insight.type === 'praise' ? 'text-green-600' :
                        insight.type === 'improvement' ? 'text-orange-600' : 'text-blue-600'
                      }`} />
                    ) : insight.type === 'improvement' ? (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      insight.type === 'praise' ? 'bg-green-100 text-green-700' :
                      insight.type === 'improvement' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {insight.type}
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {insight.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-500">{(insight.aiConfidence * 100).toFixed(0)}% AI confidence</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-800 mb-4">{insight.message}</p>
                
                {insight.suggestedActions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Suggested Actions:</p>
                    <ul className="space-y-1">
                      {insight.suggestedActions.map((action, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-blue-500" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Evidence from transcript:</p>
                  <p className="text-xs text-gray-600 italic">"{insight.transcriptEvidence.text}"</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Context: {insight.transcriptEvidence.context} • 
                    Timestamp: {Math.floor(insight.transcriptEvidence.timestamp / 60)}:{(insight.transcriptEvidence.timestamp % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                  <span>Expected improvement: {insight.estimatedImprovementTime}</span>
                  <span>Impact level: <span className={`font-medium ${
                    insight.impactLevel === 'high' ? 'text-red-600' :
                    insight.impactLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>{insight.impactLevel}</span></span>
                </div>
              </div>
              
              {insight.actionable && (
                <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Create Action Plan
                </button>
              )}
            </div>
          </motion.div>
        ))
        )}
      </div>
    </div>
  );

  const renderActionPlansTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Action Plans & Progress</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Action Plan
        </button>
      </div>

      <div className="grid gap-6">
        {actionPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    plan.priority === 'high' ? 'bg-red-100 text-red-700' :
                    plan.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {plan.priority} priority
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    plan.status === 'completed' ? 'bg-green-100 text-green-700' :
                    plan.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    plan.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {plan.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{plan.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${plan.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Milestones */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Milestones:</p>
                  {plan.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-3 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {milestone.completed && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={milestone.completed ? 'text-gray-500 line-through' : 'text-gray-700'}>
                        {milestone.title}
                      </span>
                      <span className="text-xs text-gray-400">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                  <span>Assigned by: {plan.assignedBy}</span>
                  <span>Due: {new Date(plan.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-blue-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading coaching analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8" />
              AI Coaching Hub
            </h1>
            <p className="text-purple-100 mt-1">
              Intelligent coaching insights, performance analytics, and action plan management
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/10 rounded-lg p-1">
              {['1w', '1m', '3m', '6m'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    timeRange === range ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {range === '1w' ? 'Week' : range === '1m' ? 'Month' : range === '3m' ? '3 Months' : '6 Months'}
                </button>
              ))}
            </div>
            
            <button 
              onClick={fetchAnalytics}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview', icon: Activity },
            { key: 'insights', label: 'Smart Insights', icon: Brain },
            { key: 'action-plans', label: 'Action Plans', icon: Target },
            { key: 'agents', label: 'Agent Analytics', icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === key ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Analytics</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {/* Tab Content */}
      {!error && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'insights' && renderInsightsTab()}
          {activeTab === 'action-plans' && renderActionPlansTab()}
          {activeTab === 'agents' && (
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Analytics Coming Soon</h3>
              <p className="text-gray-600">Individual agent performance analytics and coaching recommendations will be available here.</p>
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default EnhancedCoachingDashboard;
