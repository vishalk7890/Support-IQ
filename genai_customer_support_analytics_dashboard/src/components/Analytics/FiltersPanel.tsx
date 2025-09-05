import React, { useState, useEffect } from 'react';
import { Filter, X, Users, Globe, Target, Clock } from 'lucide-react';
import { AnalyticsFilters, AnalyticsData } from '../../services/analyticsService';

interface FiltersPanelProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  analyticsData: AnalyticsData | null;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({ filters, onFiltersChange, analyticsData }) => {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(filters);

  // Available options extracted from analytics data
  const availableLanguages = analyticsData?.languageInsights.map(lang => lang.language) || [];
  const availableAgents = analyticsData?.agentPerformance.map(agent => agent.agentName) || [];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const resetFilters: AnalyticsFilters = {
      dateRange: filters.dateRange, // Keep the date range
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = () => {
    return !!(
      localFilters.agents?.length ||
      localFilters.languages?.length ||
      localFilters.confidenceThreshold ||
      localFilters.durationRange
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Advanced Filters
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            disabled={!hasActiveFilters()}
          >
            Reset All
          </button>
          <button
            onClick={applyFilters}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Agent Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            Agents
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
            {availableAgents.map(agent => (
              <label key={agent} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localFilters.agents?.includes(agent) || false}
                  onChange={(e) => {
                    const currentAgents = localFilters.agents || [];
                    if (e.target.checked) {
                      handleFilterChange('agents', [...currentAgents, agent]);
                    } else {
                      handleFilterChange('agents', currentAgents.filter(a => a !== agent));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{agent}</span>
              </label>
            ))}
          </div>
          {(localFilters.agents?.length || 0) > 0 && (
            <div className="mt-2 text-xs text-blue-600">
              {localFilters.agents!.length} agent{localFilters.agents!.length > 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Language Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            Languages
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
            {availableLanguages.map(language => (
              <label key={language} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localFilters.languages?.includes(language) || false}
                  onChange={(e) => {
                    const currentLanguages = localFilters.languages || [];
                    if (e.target.checked) {
                      handleFilterChange('languages', [...currentLanguages, language]);
                    } else {
                      handleFilterChange('languages', currentLanguages.filter(l => l !== language));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{language}</span>
              </label>
            ))}
          </div>
          {(localFilters.languages?.length || 0) > 0 && (
            <div className="mt-2 text-xs text-blue-600">
              {localFilters.languages!.length} language{localFilters.languages!.length > 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Confidence Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            Min Confidence
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localFilters.confidenceThreshold || 0}
              onChange={(e) => handleFilterChange('confidenceThreshold', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span className="font-medium text-blue-600">
                {((localFilters.confidenceThreshold || 0) * 100).toFixed(0)}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Duration Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Duration Range (seconds)
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Min Duration</label>
              <input
                type="number"
                placeholder="0"
                value={localFilters.durationRange?.min || ''}
                onChange={(e) => {
                  const min = e.target.value ? parseInt(e.target.value) : undefined;
                  handleFilterChange('durationRange', {
                    ...localFilters.durationRange,
                    min,
                    max: localFilters.durationRange?.max
                  });
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Max Duration</label>
              <input
                type="number"
                placeholder="∞"
                value={localFilters.durationRange?.max || ''}
                onChange={(e) => {
                  const max = e.target.value ? parseInt(e.target.value) : undefined;
                  handleFilterChange('durationRange', {
                    ...localFilters.durationRange,
                    min: localFilters.durationRange?.min,
                    max
                  });
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {localFilters.agents?.map(agent => (
              <span
                key={agent}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
              >
                Agent: {agent}
                <button
                  onClick={() => {
                    const newAgents = localFilters.agents?.filter(a => a !== agent);
                    handleFilterChange('agents', newAgents?.length ? newAgents : undefined);
                  }}
                  className="ml-1 hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {localFilters.languages?.map(language => (
              <span
                key={language}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
              >
                Lang: {language}
                <button
                  onClick={() => {
                    const newLanguages = localFilters.languages?.filter(l => l !== language);
                    handleFilterChange('languages', newLanguages?.length ? newLanguages : undefined);
                  }}
                  className="ml-1 hover:text-green-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {localFilters.confidenceThreshold && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Confidence: ≥{(localFilters.confidenceThreshold * 100).toFixed(0)}%
                <button
                  onClick={() => handleFilterChange('confidenceThreshold', undefined)}
                  className="ml-1 hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {localFilters.durationRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                Duration: {localFilters.durationRange.min || 0}s-{localFilters.durationRange.max || '∞'}s
                <button
                  onClick={() => handleFilterChange('durationRange', undefined)}
                  className="ml-1 hover:text-orange-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltersPanel;
