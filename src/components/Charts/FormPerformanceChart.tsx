import React from 'react';
import { Card, Typography, Skeleton } from 'antd';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { DashboardData } from '../../lib/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title } = Typography;

interface FormPerformanceChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

export default function FormPerformanceChart({ data, loading = false, height = 300 }: FormPerformanceChartProps) {
  if (loading) {
    return (
      <Card 
        className="dashboard-card"
        style={{ height: '100%' }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Form Performance</Title>
        <div style={{ height: `${height}px` }}>
          <Skeleton.Input active style={{ width: '100%', height: '100%' }} />
        </div>
      </Card>
    );
  }

  if (!data || !data.formBreakdown) {
    return (
      <Card 
        className="dashboard-card"
        style={{ height: '100%' }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Form Performance</Title>
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

  // Prepare chart data
  const formData = data.formBreakdown;
  const labels = Object.keys(formData);
  const values = Object.values(formData);

  // Sort by performance (highest first)
  const sortedData = labels
    .map((label, index) => ({ label, value: values[index] }))
    .sort((a, b) => b.value - a.value);

  const sortedLabels = sortedData.map(item => formatFormLabel(item.label));
  const sortedValues = sortedData.map(item => item.value);

  // Generate colors based on performance
  const generateBarColors = (values: number[]): string[] => {
    const max = Math.max(...values);
    return values.map(value => {
      const intensity = max > 0 ? value / max : 0;
      const opacity = 0.7 + (intensity * 0.3); // 0.7 to 1.0 opacity
      return `rgba(24, 144, 255, ${opacity})`; // Primary blue with varying opacity
    });
  };

  const chartData = {
    labels: sortedLabels,
    datasets: [{
      label: 'Lead Count',
      data: sortedValues,
      backgroundColor: generateBarColors(sortedValues),
      borderColor: '#1890ff',
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
      hoverBackgroundColor: sortedValues.map(() => '#40a9ff'),
      hoverBorderColor: '#1890ff',
      hoverBorderWidth: 2
    }]
  };

  const chartOptions: ChartOptions<'bar'> = {
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
            return context[0].label;
          },
          label: (context) => {
            const value = context.parsed.y;
            const total = sortedValues.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            
            return `${value} leads (${percentage}%)`;
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
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          maxRotation: 45,
          minRotation: 0
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
            size: 12,
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
      duration: 1000,
      easing: 'easeOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      bar: {
        borderRadius: 6
      }
    }
  };

  return (
    <Card 
      className="dashboard-card fade-in"
      style={{ height: '100%' }}
      hoverable
    >
      <Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
        Form Performance
      </Title>
      
      <div style={{ position: 'relative', height: `${height}px` }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* Performance summary */}
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
            <div style={{ color: '#8c8c8c' }}>Top Performer</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {getTopForm(formData)}
            </div>
          </div>
          <div>
            <div style={{ color: '#8c8c8c' }}>Total Forms</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {labels.length} types
            </div>
          </div>
          <div>
            <div style={{ color: '#8c8c8c' }}>Conversion Rate</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {getConversionRate(data)}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Format form labels for better display
 */
function formatFormLabel(form: string): string {
  const labelMap: Record<string, string> = {
    'Mobile POS v3': 'Mobile v3',
    'Tablet POS v3': 'Tablet v3',
    'Tablet POS v4': 'Tablet v4',
    'Unbounce LP': 'Landing Page',
    'Other': 'Other'
  };
  
  return labelMap[form] || form;
}

/**
 * Get the top performing form
 */
function getTopForm(formBreakdown: Record<string, number>): string {
  const entries = Object.entries(formBreakdown);
  if (entries.length === 0) return 'N/A';
  
  const topEntry = entries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  const [form, count] = topEntry;
  return `${formatFormLabel(form)} (${count})`;
}

/**
 * Calculate conversion rate based on complete vs incomplete leads
 */
function getConversionRate(data: DashboardData): number {
  if (!data || data.totalCount === 0) return 0;
  
  // Simple conversion rate based on data completeness
  return data.completenessRate || 0;
}