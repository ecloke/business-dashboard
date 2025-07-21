import React from 'react';
import { Card, Typography, Skeleton } from 'antd';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { DashboardData } from '../../lib/types';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Title: AntTitle } = Typography;

interface ProductsBreakdownChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

export default function ProductsBreakdownChart({ data, loading = false, height = 300 }: ProductsBreakdownChartProps) {
  if (loading) {
    return (
      <Card 
        variant="borderless"
        style={{ 
          height: '100%',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
        }}
      >
        <AntTitle level={4} style={{ marginBottom: '16px' }}>Products Breakdown</AntTitle>
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton.Input active style={{ width: '100%', height: `${height}px` }} />
        </div>
      </Card>
    );
  }

  if (!data || !data.messageBreakdown) {
    return (
      <Card 
        variant="borderless"
        style={{ 
          height: '100%',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
        }}
      >
        <AntTitle level={4} style={{ marginBottom: '16px' }}>Products Breakdown</AntTitle>
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
  const messageData = data.messageBreakdown;
  const sortedEntries = Object.entries(messageData)
    .filter(([key]) => key !== 'Unknown' && key !== '')
    .sort(([, a], [, b]) => b - a) // Sort by count descending
    .slice(0, 10); // Take top 10

  const labels = sortedEntries.map(([key]) => formatProductName(key));
  const values = sortedEntries.map(([, value]) => value);
  
  // Generate colors for bars
  const colors = values.map((_, index) => {
    const baseColors = [
      '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
      '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
    ];
    return baseColors[index % baseColors.length];
  });

  const chartData = {
    labels,
    datasets: [{
      label: 'Leads',
      data: values,
      backgroundColor: colors.map(color => `${color}20`), // Add transparency
      borderColor: colors,
      borderWidth: 2,
      borderRadius: 4,
      borderSkipped: false,
    }]
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for cleaner look
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
            const total = values.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${value} leads (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          stepSize: 1,
          color: '#666666',
          callback: function(value) {
            return Number.isInteger(Number(value)) ? value : '';
          }
        },
        title: {
          display: true,
          text: 'Number of Leads',
          color: '#666666',
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666666',
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Products/Services',
          color: '#666666',
          font: {
            size: 12,
            weight: 500
          }
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
        borderRadius: 4,
      }
    }
  };

  const totalProducts = Object.values(messageData).reduce((a, b) => a + b, 0);
  const topProduct = sortedEntries.length > 0 ? sortedEntries[0] : null;

  return (
    <Card 
      bordered={false}
      style={{ 
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}
    >
      <AntTitle level={4} style={{ marginBottom: '16px', color: '#262626' }}>
        Products Breakdown
      </AntTitle>
      
      <div style={{ height: `${height}px`, marginBottom: '16px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* Summary stats */}
      <div style={{ 
        padding: '12px',
        background: '#fafafa',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#8c8c8c'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span>Total Products:</span>
          <span style={{ color: '#262626', fontWeight: '500' }}>
            {Object.keys(messageData).filter(key => key !== 'Unknown' && key !== '').length}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Top Product:</span>
          <span style={{ color: '#262626', fontWeight: '500' }}>
            {topProduct ? `${formatProductName(topProduct[0])} (${topProduct[1]} leads)` : 'N/A'}
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Format product names for better display
 */
function formatProductName(product: string): string {
  if (!product || product === 'Unknown') return 'Unknown';
  
  // Capitalize and clean up product names
  return product
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/pos/gi, 'POS') // Keep POS capitalized
    .replace(/v(\d+)/gi, 'v$1'); // Keep version formatting
}