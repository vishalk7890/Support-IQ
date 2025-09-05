import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart, ScatterChart } from 'echarts/charts';
import { 
  GridComponent, 
  TooltipComponent, 
  LegendComponent, 
  TitleComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart, 
  BarChart, 
  PieChart, 
  ScatterChart,
  GridComponent, 
  TooltipComponent, 
  LegendComponent, 
  TitleComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer
]);

interface AnalyticsChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'scatter';
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  title?: string;
  isDashed?: boolean;
  showDataZoom?: boolean;
  showToolbox?: boolean;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  type,
  xKey,
  yKey,
  color = '#3B82F6',
  height = 300,
  title,
  isDashed = false,
  showDataZoom = false,
  showToolbox = false,
}) => {
  const option = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Data Available',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#9CA3AF',
            fontSize: 16,
          },
        },
      };
    }

    // Base configuration
    const baseConfig = {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 1000,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
          fontSize: 12,
        },
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#9CA3AF'
          }
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: showDataZoom ? '15%' : '10%',
        top: title ? '15%' : '10%',
        containLabel: true,
      },
    };

    // Add title if provided
    if (title) {
      baseConfig.title = {
        text: title,
        left: 'left',
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#1F2937',
        },
      };
    }

    // Add data zoom if enabled
    if (showDataZoom) {
      baseConfig.dataZoom = [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 30,
        },
      ];
    }

    // Add toolbox if enabled
    if (showToolbox) {
      baseConfig.toolbox = {
        feature: {
          saveAsImage: { 
            title: 'Save as Image',
            backgroundColor: '#ffffff',
          },
          dataZoom: {
            title: {
              zoom: 'Zoom',
              back: 'Reset Zoom'
            }
          },
          restore: { title: 'Restore' },
        },
        right: '20px',
        top: '20px',
      };
    }

    switch (type) {
      case 'line':
        return {
          ...baseConfig,
          xAxis: {
            type: 'category',
            data: data.map(item => {
              const value = item[xKey];
              // Format dates nicely
              if (typeof value === 'string' && value.includes('-')) {
                try {
                  return new Date(value).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
                } catch {
                  return value;
                }
              }
              return value;
            }),
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            axisLabel: { 
              color: '#6B7280',
              fontSize: 11,
              rotate: data.length > 10 ? 45 : 0,
            },
            axisTick: { show: false },
          },
          yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { 
              color: '#6B7280',
              fontSize: 11,
            },
            splitLine: { lineStyle: { color: '#F3F4F6' } },
          },
          series: [{
            data: data.map(item => item[yKey]),
            type: 'line',
            smooth: true,
            lineStyle: { 
              color: color,
              width: 3,
              type: isDashed ? 'dashed' : 'solid',
            },
            areaStyle: isDashed ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: `${color}30` },
                  { offset: 1, color: `${color}05` }
                ]
              }
            },
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: color },
            emphasis: {
              itemStyle: { color: color, borderColor: '#fff', borderWidth: 2 }
            }
          }]
        };

      case 'bar':
        return {
          ...baseConfig,
          xAxis: {
            type: 'category',
            data: data.map(item => item[xKey]),
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            axisLabel: { color: '#6B7280', fontSize: 11 },
            axisTick: { show: false },
          },
          yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#6B7280', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F3F4F6' } },
          },
          series: [{
            data: data.map(item => item[yKey]),
            type: 'bar',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: color },
                  { offset: 1, color: `${color}80` }
                ]
              },
              borderRadius: [4, 4, 0, 0],
            },
            emphasis: {
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: `${color}E0` },
                    { offset: 1, color: color }
                  ]
                }
              }
            },
            barWidth: '60%',
          }]
        };

      case 'pie':
        return {
          ...baseConfig,
          grid: undefined, // Pie charts don't use grid
          series: [{
            type: 'pie',
            data: data.map((item, index) => ({
              name: item[xKey],
              value: item[yKey],
              itemStyle: {
                color: `hsl(${(index * 45) % 360}, 70%, 60%)`
              }
            })),
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            }
          }],
          legend: {
            orient: 'vertical',
            left: 'left',
            data: data.map(item => item[xKey])
          }
        };

      case 'scatter':
        return {
          ...baseConfig,
          xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            axisLabel: { color: '#6B7280', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F3F4F6' } },
          },
          yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#6B7280', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F3F4F6' } },
          },
          series: [{
            data: data.map(item => [item[xKey], item[yKey]]),
            type: 'scatter',
            symbolSize: 8,
            itemStyle: {
              color: color,
              opacity: 0.7,
            },
            emphasis: {
              itemStyle: {
                color: color,
                opacity: 1,
                borderColor: '#fff',
                borderWidth: 2,
              }
            }
          }]
        };

      default:
        return baseConfig;
    }
  }, [data, type, xKey, yKey, color, title, isDashed, showDataZoom, showToolbox]);

  // Loading state
  if (!data) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <div className="text-gray-500 text-sm">Loading chart...</div>
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default AnalyticsChart;
