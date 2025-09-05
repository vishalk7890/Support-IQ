import { useListService, ListItem } from './listService';
import { useAuthenticatedRequest } from '../hooks/useApiClient';

export interface AnalyticsData {
  // Time-based metrics
  callVolumeTrends: {
    date: string;
    count: number;
    duration: number;
  }[];
  
  // Performance metrics
  performanceMetrics: {
    totalCalls: number;
    avgDuration: number;
    avgConfidence: number;
    processingSuccessRate: number;
    languageDistribution: { [key: string]: number };
  };
  
  // Agent analytics
  agentPerformance: {
    agentId: string;
    agentName: string;
    totalCalls: number;
    avgConfidence: number;
    avgDuration: number;
    performanceScore: number;
  }[];
  
  // Time-based trends
  hourlyDistribution: { hour: number; count: number }[];
  dailyTrends: { day: string; count: number; avgDuration: number }[];
  weeklyComparison: {
    thisWeek: number;
    lastWeek: number;
    growth: number;
  };
  
  // Quality metrics
  confidenceDistribution: { range: string; count: number; percentage: number }[];
  durationAnalysis: {
    quickCalls: number; // < 2 minutes
    standardCalls: number; // 2-5 minutes
    longCalls: number; // > 5 minutes
    avgDuration: number;
  };
  
  // Business insights
  languageInsights: {
    language: string;
    count: number;
    avgConfidence: number;
    avgDuration: number;
  }[];
  
  // Forecasting data
  forecastData: {
    date: string;
    predicted: number;
    confidence: number;
  }[];
}

export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  agents?: string[];
  languages?: string[];
  confidenceThreshold?: number;
  durationRange?: {
    min: number;
    max: number;
  };
}

// Hook for using analytics service
export const useAnalyticsService = () => {
  const { getList } = useListService();
  const { makeRequest } = useAuthenticatedRequest();

  /**
   * Main analytics data processor
   */
  const getAnalyticsData = async (filters?: AnalyticsFilters): Promise<AnalyticsData> => {
    try {
      console.log('📊 Fetching analytics data...');
      const rawData = await getList();
      
      console.log('🔍 Raw data fetched:', rawData);
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.log('⚠️ No data available from API');
        return getEmptyAnalytics();
      }

      console.log('📊 Processing', rawData.length, 'records');
      
      // Apply filters if provided
      const filteredData = filters ? applyFilters(rawData, filters) : rawData;
      
      // Process all analytics
      const analytics: AnalyticsData = {
        callVolumeTrends: calculateCallVolumeTrends(filteredData),
        performanceMetrics: calculatePerformanceMetrics(filteredData),
        agentPerformance: calculateAgentPerformance(filteredData),
        hourlyDistribution: calculateHourlyDistribution(filteredData),
        dailyTrends: calculateDailyTrends(filteredData),
        weeklyComparison: calculateWeeklyComparison(filteredData),
        confidenceDistribution: calculateConfidenceDistribution(filteredData),
        durationAnalysis: calculateDurationAnalysis(filteredData),
        languageInsights: calculateLanguageInsights(filteredData),
        forecastData: calculateForecastData(filteredData),
      };

      console.log('✅ Analytics data processed successfully:', analytics);
      return analytics;
    } catch (error) {
      console.error('❌ Error processing analytics data:', error);
      return getEmptyAnalytics();
    }
  };

  /**
   * Apply filters to raw data
   */
  const applyFilters = (data: ListItem[], filters: AnalyticsFilters): ListItem[] => {
    return data.filter(item => {
      // Date range filter
      if (filters.dateRange) {
        const itemDate = extractDate(item);
        if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
          return false;
        }
      }

      // Language filter
      if (filters.languages && filters.languages.length > 0) {
        if (!filters.languages.includes(item.lang)) {
          return false;
        }
      }

      // Confidence threshold filter
      if (filters.confidenceThreshold) {
        const confidence = parseFloat(item.confidence || '0');
        if (confidence < filters.confidenceThreshold) {
          return false;
        }
      }

      // Duration range filter
      if (filters.durationRange) {
        const duration = parseFloat(item.duration || '0');
        if (duration < filters.durationRange.min || duration > filters.durationRange.max) {
          return false;
        }
      }

      return true;
    });
  };

  /**
   * Calculate call volume trends over time
   */
  const calculateCallVolumeTrends = (data: ListItem[]) => {
    const trends: { [key: string]: { count: number; duration: number } } = {};
    
    data.forEach(item => {
      const date = extractDate(item).toISOString().split('T')[0];
      const duration = parseFloat(item.duration || '0');
      
      if (!trends[date]) {
        trends[date] = { count: 0, duration: 0 };
      }
      trends[date].count++;
      trends[date].duration += duration;
    });

    return Object.entries(trends)
      .map(([date, stats]) => ({
        date,
        count: stats.count,
        duration: stats.duration / stats.count // Average duration
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate overall performance metrics
   */
  private calculatePerformanceMetrics(data: ListItem[]) {
    const totalCalls = data.length;
    const totalDuration = data.reduce((sum, item) => sum + parseFloat(item.duration || '0'), 0);
    const totalConfidence = data.reduce((sum, item) => sum + parseFloat(item.confidence || '0'), 0);
    const successfulProcessing = data.filter(item => parseFloat(item.confidence || '0') > 0.5).length;
    
    // Language distribution
    const languageDistribution: { [key: string]: number } = {};
    data.forEach(item => {
      const lang = item.lang || 'Unknown';
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
    });

    return {
      totalCalls,
      avgDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
      avgConfidence: totalCalls > 0 ? totalConfidence / totalCalls : 0,
      processingSuccessRate: totalCalls > 0 ? (successfulProcessing / totalCalls) * 100 : 0,
      languageDistribution,
    };
  }

  /**
   * Calculate agent performance metrics
   */
  private calculateAgentPerformance(data: ListItem[]) {
    const agentStats: { [key: string]: {
      name: string;
      calls: ListItem[];
      totalDuration: number;
      totalConfidence: number;
    } } = {};

    data.forEach(item => {
      const agentName = this.extractAgentName(item);
      const agentId = agentName || 'Unknown';
      
      if (!agentStats[agentId]) {
        agentStats[agentId] = {
          name: agentName || 'Unknown Agent',
          calls: [],
          totalDuration: 0,
          totalConfidence: 0,
        };
      }

      agentStats[agentId].calls.push(item);
      agentStats[agentId].totalDuration += parseFloat(item.duration || '0');
      agentStats[agentId].totalConfidence += parseFloat(item.confidence || '0');
    });

    return Object.entries(agentStats).map(([agentId, stats]) => {
      const callCount = stats.calls.length;
      const avgConfidence = callCount > 0 ? stats.totalConfidence / callCount : 0;
      const avgDuration = callCount > 0 ? stats.totalDuration / callCount : 0;
      
      // Performance score calculation (weighted)
      const performanceScore = (avgConfidence * 0.6) + ((avgDuration > 0 ? Math.min(300, avgDuration) / 300 : 0) * 0.4);

      return {
        agentId,
        agentName: stats.name,
        totalCalls: callCount,
        avgConfidence,
        avgDuration,
        performanceScore: performanceScore * 100,
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore);
  }

  /**
   * Calculate hourly distribution of calls
   */
  private calculateHourlyDistribution(data: ListItem[]) {
    const hourlyStats: { [key: number]: number } = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = 0;
    }

    data.forEach(item => {
      const hour = this.extractDate(item).getHours();
      hourlyStats[hour]++;
    });

    return Object.entries(hourlyStats).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));
  }

  /**
   * Calculate daily trends
   */
  private calculateDailyTrends(data: ListItem[]) {
    const dailyStats: { [key: string]: { count: number; totalDuration: number } } = {};
    
    data.forEach(item => {
      const date = this.extractDate(item);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const duration = parseFloat(item.duration || '0');
      
      if (!dailyStats[day]) {
        dailyStats[day] = { count: 0, totalDuration: 0 };
      }
      dailyStats[day].count++;
      dailyStats[day].totalDuration += duration;
    });

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return dayOrder.map(day => ({
      day,
      count: dailyStats[day]?.count || 0,
      avgDuration: dailyStats[day]?.count > 0 ? dailyStats[day].totalDuration / dailyStats[day].count : 0,
    }));
  }

  /**
   * Calculate weekly comparison
   */
  private calculateWeeklyComparison(data: ListItem[]) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = data.filter(item => this.extractDate(item) >= weekAgo).length;
    const lastWeek = data.filter(item => {
      const date = this.extractDate(item);
      return date >= twoWeeksAgo && date < weekAgo;
    }).length;

    const growth = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    return {
      thisWeek,
      lastWeek,
      growth,
    };
  }

  /**
   * Calculate confidence distribution
   */
  private calculateConfidenceDistribution(data: ListItem[]) {
    const ranges = [
      { range: '90-100%', min: 0.9, max: 1.0 },
      { range: '80-90%', min: 0.8, max: 0.9 },
      { range: '70-80%', min: 0.7, max: 0.8 },
      { range: '60-70%', min: 0.6, max: 0.7 },
      { range: 'Below 60%', min: 0, max: 0.6 },
    ];

    const totalCalls = data.length;
    
    return ranges.map(({ range, min, max }) => {
      const count = data.filter(item => {
        const confidence = parseFloat(item.confidence || '0');
        return confidence >= min && confidence < max;
      }).length;

      return {
        range,
        count,
        percentage: totalCalls > 0 ? (count / totalCalls) * 100 : 0,
      };
    });
  }

  /**
   * Calculate duration analysis
   */
  private calculateDurationAnalysis(data: ListItem[]) {
    const durations = data.map(item => parseFloat(item.duration || '0'));
    const quickCalls = durations.filter(d => d < 120).length; // < 2 minutes
    const standardCalls = durations.filter(d => d >= 120 && d <= 300).length; // 2-5 minutes
    const longCalls = durations.filter(d => d > 300).length; // > 5 minutes
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    return {
      quickCalls,
      standardCalls,
      longCalls,
      avgDuration: avgDuration || 0,
    };
  }

  /**
   * Calculate language insights
   */
  private calculateLanguageInsights(data: ListItem[]) {
    const languageStats: { [key: string]: {
      count: number;
      totalConfidence: number;
      totalDuration: number;
    } } = {};

    data.forEach(item => {
      const lang = item.lang || 'Unknown';
      const confidence = parseFloat(item.confidence || '0');
      const duration = parseFloat(item.duration || '0');

      if (!languageStats[lang]) {
        languageStats[lang] = { count: 0, totalConfidence: 0, totalDuration: 0 };
      }

      languageStats[lang].count++;
      languageStats[lang].totalConfidence += confidence;
      languageStats[lang].totalDuration += duration;
    });

    return Object.entries(languageStats)
      .map(([language, stats]) => ({
        language,
        count: stats.count,
        avgConfidence: stats.count > 0 ? stats.totalConfidence / stats.count : 0,
        avgDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate forecast data (simple trend-based prediction)
   */
  private calculateForecastData(data: ListItem[]) {
    const dailyData = this.calculateCallVolumeTrends(data);
    
    if (dailyData.length < 7) {
      return []; // Not enough data for forecasting
    }

    // Simple linear regression for next 7 days
    const recentData = dailyData.slice(-14); // Last 2 weeks
    const trend = this.calculateLinearTrend(recentData.map(d => d.count));
    
    const lastDate = new Date(dailyData[dailyData.length - 1].date);
    const forecastData = [];

    for (let i = 1; i <= 7; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);
      
      const predicted = Math.max(0, Math.round(trend.slope * (recentData.length + i) + trend.intercept));
      
      forecastData.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted,
        confidence: Math.max(0.3, Math.min(0.9, trend.r2)), // R-squared as confidence
      });
    }

    return forecastData;
  }

  /**
   * Helper: Extract date from list item
   */
  private extractDate(item: ListItem): Date {
    // Try different date field possibilities
    const dateFields = ['createdAt', 'timestamp', 'jobName', 'key'];
    
    for (const field of dateFields) {
      if (item[field]) {
        // If it's in the filename, extract timestamp
        if (field === 'jobName' || field === 'key') {
          const dateMatch = item[field].match(/DT_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
          if (dateMatch) {
            return new Date(dateMatch[1].replace(/-/g, ':'));
          }
        } else {
          const date = new Date(item[field]);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }
    
    // Default to current date if no valid date found
    return new Date();
  }

  /**
   * Helper: Extract agent name from item
   */
  private extractAgentName(item: ListItem): string | null {
    // Try to extract from jobName field
    if (item.jobName) {
      const agentMatch = item.jobName.match(/AGENT_([^_]+)/);
      if (agentMatch) {
        return agentMatch[1];
      }
    }
    
    // Try other possible fields
    const agentFields = ['agent', 'agentName', 'agentId'];
    for (const field of agentFields) {
      if (item[field]) {
        return item[field];
      }
    }
    
    return null;
  }

  /**
   * Helper: Calculate linear trend
   */
  private calculateLinearTrend(data: number[]) {
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = data.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssRes = data.reduce((sum, val, i) => sum + Math.pow(val - (slope * i + intercept), 2), 0);
    const r2 = 1 - (ssRes / ssTotal);

    return { slope, intercept, r2 };
  }

  /**
   * Empty analytics structure
   */
  private getEmptyAnalytics(): AnalyticsData {
    return {
      callVolumeTrends: [],
      performanceMetrics: {
        totalCalls: 0,
        avgDuration: 0,
        avgConfidence: 0,
        processingSuccessRate: 0,
        languageDistribution: {},
      },
      agentPerformance: [],
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
      dailyTrends: [],
      weeklyComparison: { thisWeek: 0, lastWeek: 0, growth: 0 },
      confidenceDistribution: [],
      durationAnalysis: { quickCalls: 0, standardCalls: 0, longCalls: 0, avgDuration: 0 },
      languageInsights: [],
      forecastData: [],
    };
  }
}

// Hook for using analytics service
export const useAnalyticsService = () => {
  return new AnalyticsService();
};
