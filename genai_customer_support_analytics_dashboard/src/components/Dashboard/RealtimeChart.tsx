import React from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

const RealtimeChart: React.FC = () => {
  const option = {
    title: {
      text: 'Real-time Conversation Analytics',
      left: 'left',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#1F2937'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: {
        color: '#374151'
      }
    },
    legend: {
      data: ['Active Conversations', 'Sentiment Score', 'Response Time'],
      bottom: 10,
      textStyle: {
        color: '#6B7280'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280'
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6'
        }
      }
    },
    series: [
      {
        name: 'Active Conversations',
        type: 'line',
        data: [15, 23, 18, 32, 28, 25, 22, 19],
        smooth: true,
        lineStyle: { 
          color: '#3B82F6',
          width: 3
        },
        areaStyle: { 
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(59, 130, 246, 0.3)'
            }, {
              offset: 1, color: 'rgba(59, 130, 246, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: 'Sentiment Score',
        type: 'line',
        data: [0.6, 0.7, 0.5, 0.8, 0.7, 0.6, 0.8, 0.7],
        smooth: true,
        lineStyle: { 
          color: '#10B981',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: 'Response Time',
        type: 'line',
        data: [120, 95, 140, 85, 110, 100, 90, 105],
        smooth: true,
        lineStyle: { 
          color: '#F59E0B',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: '400px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default RealtimeChart;
