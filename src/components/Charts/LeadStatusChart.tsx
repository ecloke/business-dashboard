import React from 'react';
import { Card, Typography, Skeleton } from 'antd';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { DashboardData } from '../../lib/types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const { Title } = Typography;

interface LeadStatusChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

export default function LeadStatusChart({ data, loading = false, height = 300 }: LeadStatusChartProps) {
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
        <Title level={4} style={{ marginBottom: '16px' }}>Lead Status Overview</Title>
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton.Node active style={{ width: '200px', height: '200px' }}>
            <div style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
          </Skeleton.Node>
        </div>
      </Card>
    );
  }

  if (!data || !data.leadStatusBreakdown) {
    return (
      <Card 
        variant="borderless"
        style={{ 
          height: '100%',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
        }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Lead Status Overview</Title>
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
  const statusData = data.leadStatusBreakdown;
  const labels = Object.keys(statusData);
  const values = Object.values(statusData);
  
  // Color mapping for different lead statuses
  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'Won': '#52c41a',           // Green for successful
      'Lost': '#ff4d4f',          // Red for lost
      'New': '#1890ff',           // Blue for new
      'Contacted': '#faad14',     // Orange for contacted
      'Qualified': '#722ed1',     // Purple for qualified
      'Unqualified': '#8c8c8c',   // Gray for unqualified
      'Unknown': '#d9d9d9'        // Light gray for unknown
    };
    
    return colorMap[status] || '#8c8c8c';
  };

  // Create colors array with proper mapping
  const colors = labels.map(label => {
    console.log('LeadStatus label:', label, 'Color:', getStatusColor(label));
    return getStatusColor(label);
  });

  const chartData = {
    labels: labels.map(label => formatStatusLabel(label)),
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverBorderColor: '#ffffff'
    }]
  };

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          color: '#262626',
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] as number;
                const total = (data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                const originalLabel = labels[i]; // Get original label for color mapping
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: colors[i],
                  strokeStyle: colors[i],
                  lineWidth: 0,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#f0f0f0',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            
            return `${label}: ${value} leads (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 0,
        borderJoinStyle: 'round'
      }
    },
    animation: {
      animateRotate: true,
      animateScale: false,
      duration: 1000,
      easing: 'easeOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const totalLeads = values.reduce((a, b) => a + b, 0);
  const wonLeads = statusData['Won'] || 0;
  const lostLeads = statusData['Lost'] || 0;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  return (
    <Card 
      bordered={false}
      style={{ 
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}
    >
      <Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
        Lead Status Overview
      </Title>
      
      <div style={{ height: `${height}px`, marginBottom: '16px' }}>
        <Pie data={chartData} options={chartOptions} />
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
          <span>Conversion Rate:</span>
          <span style={{ 
            color: conversionRate >= 20 ? '#52c41a' : conversionRate >= 10 ? '#faad14' : '#ff4d4f', 
            fontWeight: '500' 
          }}>
            {conversionRate}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span>Won Leads:</span>
          <span style={{ color: '#52c41a', fontWeight: '500' }}>
            {wonLeads}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Lost Leads:</span>
          <span style={{ color: '#ff4d4f', fontWeight: '500' }}>
            {lostLeads}
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Format status labels for better display
 */
function formatStatusLabel(status: string): string {
  if (!status || status === 'Unknown') return 'No Status';
  
  // Capitalize first letter and keep rest as is
  return status.charAt(0).toUpperCase() + status.slice(1);
}