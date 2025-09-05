import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface TimeRangeSelectorProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  onChange: (dateRange: { start: Date; end: Date }) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ dateRange, onChange }) => {
  const [showCustom, setShowCustom] = useState(false);

  const presetRanges = [
    {
      label: 'Last 7 days',
      getValue: () => ({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }),
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }),
    },
    {
      label: 'Last 90 days',
      getValue: () => ({
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }),
    },
    {
      label: 'This week',
      getValue: () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        return {
          start: startOfWeek,
          end: new Date(),
        };
      },
    },
    {
      label: 'This month',
      getValue: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return {
          start: startOfMonth,
          end: new Date(),
        };
      },
    },
    {
      label: 'Last month',
      getValue: () => {
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        return {
          start: startOfLastMonth,
          end: endOfLastMonth,
        };
      },
    },
  ];

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    const range = preset.getValue();
    onChange(range);
    setShowCustom(false);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return;

    if (type === 'start') {
      onChange({
        start: date,
        end: dateRange.end,
      });
    } else {
      onChange({
        start: dateRange.start,
        end: date,
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Time Range
        </h3>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          Custom Range
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCustom ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Current Selection Display */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Selected Range:</span>
          <span className="text-sm text-blue-700">
            {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
          </span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {presetRanges.map((preset, index) => (
          <button
            key={index}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 border border-gray-300 hover:border-gray-400"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {showCustom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeRangeSelector;
