import React from 'react';
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

interface TrafficSourceChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

export default function TrafficSourceChart({ data, loading = false, height = 300 }: TrafficSourceChartProps) {
  if (loading) {
    return (
      <div className="modern-card">
        <div className="w-48 h-6 skeleton mb-6"></div>
        <div className="w-full skeleton rounded-full mx-auto" style={{ 
          height: `${height}px`,
          maxWidth: `${height}px`
        }}></div>
        <div className="mt-4 space-y-2">
          <div className="w-full h-4 skeleton"></div>
          <div className="w-3/4 h-4 skeleton"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.originalSourceBreakdown) {
    return (
      <div className="modern-card">
        <h3 className="title-small mb-6">Lead Sources</h3>
        <div style={{ 
          height: `${height}px`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          No data available
        </div>
      </div>
    );
  }

  // Prepare chart data using original traffic source
  const sourceData = data.originalSourceBreakdown || {};
  const originalLabels = Object.keys(sourceData);
  const labels = originalLabels.map(label => formatSourceLabel(label));
  const values = Object.values(sourceData);
  
  // Color mapping for different traffic sources
  const getSourceColor = (source: string): string => {
    const colorMap: Record<string, string> = {
      'Paid Social': '#1877f2',     // Facebook blue
      'Direct Traffic': '#22c55e',  // Green
      'Paid Search': '#ea4335',     // Google red
      'Other Campaigns': '#f59e0b', // Orange
      'Organic Social': '#f94ef0ff',  // Emerald green (for Organic Social)
      'Organic Search': '#f94ef0ff',  // Emerald green
      'Offline Sources': '#8b5cf6', // Purple
      'Email': '#8b5cf6',           // Purple
      'Other': '#6b7280',           // Gray
      'Unknown': '#9ca3af'          // Light gray
    };
    
    return colorMap[source] || '#6b7280';
  };

  // Use reliable color array
  const chartColors = [
    '#1877f2', // Facebook blue
    '#22c55e', // Green
    '#ea4335', // Google red
    '#f59e0b', // Orange
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#6b7280'  // Gray
  ];


  const chartData = {
    labels: labels,
    datasets: [{
      data: values,
      backgroundColor: chartColors.slice(0, values.length || 1),
      borderColor: 'rgba(255, 255, 255, 0.2)',
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
            size: 11,
            family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          color: '#ffffff',
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels && data.datasets && data.datasets.length > 0 && data.datasets[0].data) {
              return data.labels.map((label, i) => {
                const value = values[i] || 0;
                const total = values.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                const originalLabel = originalLabels[i];
                const formattedLabel = formatSourceLabel(originalLabel);
                
                return {
                  text: `${formattedLabel} (${percentage}%)`,
                  fillStyle: chartColors[i] || '#6b7280',
                  strokeStyle: chartColors[i] || '#6b7280',
                  fontColor: '#ffffff',
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const dataIndex = context.dataIndex;
            const value = values[dataIndex];
            const originalLabel = originalLabels[dataIndex];
            const formattedLabel = formatSourceLabel(originalLabel);
            const total = values.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            
            return `${formattedLabel}: ${value} leads (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
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
    <div className="modern-card fade-in">
      <h3 className="title-small mb-6">Lead Sources</h3>
      
      <div className="relative" style={{ height: `${height}px` }}>
        <Doughnut data={chartData} options={chartOptions} />
        
        {/* Center text showing total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {data.totalCount}
            </div>
            <div className="text-sm text-secondary">
              Total Leads
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary stats */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem',
        background: 'var(--bg-glass)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="flex justify-between items-center">
          <span>Top Source:</span>
          <span className="text-white font-medium">
            {getTopSource(sourceData)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Format source labels for better display
 */
function formatSourceLabel(source: string): string {
  const labelMap: Record<string, string> = {
    'PAID_SOCIAL': 'Paid Social',
    'Paid Social': 'Paid Social',
    'PAID_SEARCH': 'Paid Search', 
    'Paid Search': 'Paid Search',
    'DIRECT_TRAFFIC': 'Direct',
    'Direct Traffic': 'Direct',
    'SOCIAL_MEDIA': 'Social Media',
    'Social Media': 'Social Media',
    'OTHER_CAMPAIGNS': 'Other Campaigns',
    'Other Campaigns': 'Other Campaigns',
    'ORGANIC_SEARCH': 'Organic Search',
    'Organic Search': 'Organic Search',
    'ORGANIC_SOCIAL': 'Organic Social',
    'Organic Social': 'Organic Social',
    'OFFLINE_SOURCES': 'Offline',
    'Offline Sources': 'Offline',
    'Unknown': 'Unknown'
  };
  
  return labelMap[source] || source.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
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