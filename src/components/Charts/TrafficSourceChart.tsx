import React from 'react';
import { Card, Typography, Skeleton } from 'antd';
import { Doughnut } from 'react-chartjs-2';
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

interface TrafficSourceChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

export default function TrafficSourceChart({ data, loading = false, height = 300 }: TrafficSourceChartProps) {
  if (loading) {
    return (
      <Card 
        className="dashboard-card"
        style={{ height: '100%' }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Lead Sources</Title>
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton.Node active style={{ width: '200px', height: '200px' }}>
            <div style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
          </Skeleton.Node>
        </div>
      </Card>
    );
  }

  if (!data || !data.originalSourceBreakdown) {
    return (
      <Card 
        className="dashboard-card"
        style={{ height: '100%' }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Lead Sources</Title>
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

  // Prepare chart data using original traffic source
  const sourceData = data.originalSourceBreakdown;
  const labels = Object.keys(sourceData);
  const values = Object.values(sourceData);
  
  // Color mapping for different traffic sources
  const getSourceColor = (source: string): string => {
    const colorMap: Record<string, string> = {
      'Facebook': '#1877f2',        // Facebook blue
      'Paid Social': '#1877f2',     // Facebook blue
      'Direct Traffic': '#52c41a',  // Green
      'Direct': '#52c41a',          // Green
      'Google': '#ea4335',          // Google red
      'Paid Search': '#ea4335',     // Google red
      'Other Campaigns': '#faad14', // Orange
      'Organic Search': '#34a853',  // Google green
      'Email': '#faad14',           // Orange
      'Other': '#8c8c8c',           // Gray
      'Unknown': '#d9d9d9'          // Light gray
    };
    
    return colorMap[source] || '#8c8c8c';
  };

  // Create colors array with proper mapping
  const colors = labels.map(label => {
    console.log('TrafficSource label:', label, 'Color:', getSourceColor(label));
    return getSourceColor(label);
  });

  const chartData = {
    labels: labels.map(label => formatSourceLabel(label)),
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverBorderColor: '#ffffff'
    }]
  };

  const chartOptions: ChartOptions<'doughnut'> = {
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
    cutout: '65%', // Creates doughnut effect
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

  return (
    <Card 
      variant="borderless"
      style={{ 
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}
    >
      <Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
        Lead Sources
      </Title>
      
      <div style={{ position: 'relative', height: `${height}px` }}>
        <Doughnut data={chartData} options={chartOptions} />
        
        {/* Center text showing total */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#262626',
            lineHeight: '1'
          }}>
            {data.totalCount}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#8c8c8c',
            marginTop: '4px'
          }}>
            Total Leads
          </div>
        </div>
      </div>
      
      {/* Summary stats */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px',
        background: '#fafafa',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#8c8c8c'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Top Source:</span>
          <span style={{ color: '#262626', fontWeight: '500' }}>
            {getTopSource(sourceData)}
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Format source labels for better display
 */
function formatSourceLabel(source: string): string {
  const labelMap: Record<string, string> = {
    'Paid Social': 'Paid Social',
    'Direct Traffic': 'Direct Traffic',
    'Paid Search': 'Paid Search',
    'Other Campaigns': 'Other Campaigns',
    'Organic Search': 'Organic Search',
    'Unknown': 'Unknown'
  };
  
  return labelMap[source] || source;
}

/**
 * Get the top performing source
 */
function getTopSource(sourceBreakdown: Record<string, number>): string {
  const entries = Object.entries(sourceBreakdown);
  if (entries.length === 0) return 'N/A';
  
  const topEntry = entries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  const [source, count] = topEntry;
  const total = Object.values(sourceBreakdown).reduce((a, b) => a + b, 0);
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return `${formatSourceLabel(source)} (${percentage}%)`;
}