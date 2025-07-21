import React from 'react';
import { Card, Typography, Skeleton } from 'antd';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { DashboardData } from '../../lib/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

const { Title } = Typography;

interface HourlyChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

export default function HourlyChart({ data, loading = false, height = 300 }: HourlyChartProps) {
  if (loading) {
    return (
      <Card 
        className="dashboard-card"
        style={{ height: '100%' }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Leads by Hour</Title>
        <div style={{ height: `${height}px` }}>
          <Skeleton.Input active style={{ width: '100%', height: '100%' }} />
        </div>
      </Card>
    );
  }

  if (!data || !data.hourlyDistribution) {
    return (
      <Card 
        className="dashboard-card"
        style={{ height: '100%' }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Leads by Hour</Title>
        <div style={{ 
          height: `${height}px`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#8c8c8c',
          textAlign: 'center'
        }}>
          No data available
        </div>
      </Card>
    );
  }

  // Prepare hourly data (0-23 hours)
  const hourlyData = data.hourlyDistribution;
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const values = hours.map(hour => hourlyData[hour] || 0);

  // Generate labels with Malaysian timezone context
  const hourLabels = hours.map(hour => {
    const hourNum = parseInt(hour);
    if (hourNum === 0) return '12 AM';
    if (hourNum === 12) return '12 PM';
    if (hourNum < 12) return `${hourNum} AM`;
    return `${hourNum - 12} PM`;
  });

  // Create gradient for the area fill
  const createGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(24, 144, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(24, 144, 255, 0.05)');
    return gradient;
  };

  const chartData = {
    labels: hourLabels,
    datasets: [{
      label: 'Leads per Hour',
      data: values,
      borderColor: '#1890ff',
      backgroundColor: (context: any) => {
        const chart = context.chart;
        const { ctx } = chart;
        return createGradient(ctx);
      },
      borderWidth: 3,
      pointBackgroundColor: '#1890ff',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#40a9ff',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
      fill: true,
      tension: 0.4 // Smooth curves
    }]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend for cleaner look
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#f0f0f0',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: (context) => {
            const hour = context[0].label;
            return `${hour} (Malaysian Time)`;
          },
          label: (context) => {
            const value = context.parsed.y;
            const total = values.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            
            return `${value} leads (${percentage}% of daily total)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#8c8c8c',
          font: {
            size: 11,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          maxRotation: 45,
          callback: function(value, index) {
            // Show every 3rd hour label to avoid crowding
            return index % 3 === 0 ? this.getLabelForValue(value as number) : '';
          }
        },
        border: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
          display: true
        },
        ticks: {
          color: '#8c8c8c',
          font: {
            size: 11,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        },
        border: {
          display: false
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  };

  // Calculate insights
  const peakHour = getPeakHour(hourlyData);
  const totalLeads = values.reduce((a, b) => a + b, 0);
  const businessHours = getBusinessHoursInsight(hourlyData);

  return (
    <Card 
      className="dashboard-card fade-in"
      style={{ height: '100%' }}
      hoverable
    >
      <Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
        Leads by Hour (Malaysian Time)
      </Title>
      
      <div style={{ position: 'relative', height: `${height}px` }}>
        <Line data={chartData} options={chartOptions} />
      </div>
      
      {/* Hourly insights */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px',
        background: '#fafafa',
        borderRadius: '6px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div>
            <div style={{ color: '#8c8c8c' }}>Peak Hour</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {peakHour.time} ({peakHour.count} leads)
            </div>
          </div>
          <div>
            <div style={{ color: '#8c8c8c' }}>Business Hours</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {businessHours.percentage}% of leads
            </div>
          </div>
          <div>
            <div style={{ color: '#8c8c8c' }}>Most Active</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {getMostActiveTimeframe(hourlyData)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Get the peak hour for lead generation
 */
function getPeakHour(hourlyData: Record<string, number>): { time: string; count: number } {
  const entries = Object.entries(hourlyData);
  if (entries.length === 0) return { time: 'N/A', count: 0 };
  
  const peak = entries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  const [hour, count] = peak;
  const hourNum = parseInt(hour);
  const timeString = formatHour(hourNum);
  
  return { time: timeString, count };
}

/**
 * Calculate business hours (9 AM - 6 PM) performance
 */
function getBusinessHoursInsight(hourlyData: Record<string, number>): { count: number; percentage: number } {
  const businessHours = ['09', '10', '11', '12', '13', '14', '15', '16', '17'];
  const businessHoursCount = businessHours.reduce((sum, hour) => sum + (hourlyData[hour] || 0), 0);
  const totalCount = Object.values(hourlyData).reduce((sum, count) => sum + count, 0);
  const percentage = totalCount > 0 ? Math.round((businessHoursCount / totalCount) * 100) : 0;
  
  return { count: businessHoursCount, percentage };
}

/**
 * Get the most active timeframe
 */
function getMostActiveTimeframe(hourlyData: Record<string, number>): string {
  const timeframes = {
    'Morning (6-12)': ['06', '07', '08', '09', '10', '11'],
    'Afternoon (12-18)': ['12', '13', '14', '15', '16', '17'],
    'Evening (18-24)': ['18', '19', '20', '21', '22', '23'],
    'Night (0-6)': ['00', '01', '02', '03', '04', '05']
  };
  
  const timeframeCounts = Object.entries(timeframes).map(([name, hours]) => ({
    name,
    count: hours.reduce((sum, hour) => sum + (hourlyData[hour] || 0), 0)
  }));
  
  const mostActive = timeframeCounts.reduce((max, current) => 
    current.count > max.count ? current : max
  );
  
  return mostActive.name.split(' ')[0]; // Return just "Morning", "Afternoon", etc.
}

/**
 * Format hour number to 12-hour format
 */
function formatHour(hourNum: number): string {
  if (hourNum === 0) return '12 AM';
  if (hourNum === 12) return '12 PM';
  if (hourNum < 12) return `${hourNum} AM`;
  return `${hourNum - 12} PM`;
}