import React from 'react';
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

interface ProductsBreakdownChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

export default function ProductsBreakdownChart({ data, loading = false, height = 300 }: ProductsBreakdownChartProps) {
  if (loading) {
    return (
      <div className="modern-card">
        <div className="w-48 h-6 skeleton mb-6"></div>
        <div className="w-full skeleton" style={{ height: `${height}px` }}></div>
        <div className="mt-4 space-y-2">
          <div className="w-full h-4 skeleton"></div>
          <div className="w-3/4 h-4 skeleton"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.messageBreakdown) {
    return (
      <div className="modern-card">
        <h3 className="title-small mb-6">Products Breakdown</h3>
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

  // Prepare chart data
  const messageData = data.messageBreakdown || {};
  const sortedEntries = Object.entries(messageData)
    .filter(([key]) => key !== 'Unknown' && key !== '')
    .sort(([, a], [, b]) => b - a) // Sort by count descending
    .slice(0, 8); // Take top 8

  const labels = sortedEntries.map(([key]) => formatProductName(key));
  const values = sortedEntries.map(([, value]) => value);
  
  // Generate modern gradient colors for bars
  const colors = values.map((_, index) => {
    const gradients = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(139, 92, 246, 0.8)',   // Purple  
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(245, 158, 11, 0.8)',   // Amber
      'rgba(34, 197, 94, 0.8)',    // Green
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(20, 184, 166, 0.8)',   // Teal
      'rgba(168, 85, 247, 0.8)',   // Violet
    ];
    return gradients[index % gradients.length];
  });

  const borderColors = values.map((_, index) => {
    const borders = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
      '#22c55e', '#ef4444', '#14b8a6', '#a855f7'
    ];
    return borders[index % borders.length];
  });

  const chartData = {
    labels,
    datasets: [{
      label: 'Leads',
      data: values,
      backgroundColor: colors,
      borderColor: borderColors,
      borderWidth: 2,
      borderRadius: 8,
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            return `${context[0].label}`;
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
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          stepSize: 1,
          color: '#a0a9c0',
          font: {
            size: 12
          },
          callback: function(value) {
            return Number.isInteger(Number(value)) ? value : '';
          }
        },
        title: {
          display: true,
          text: 'Number of Leads',
          color: '#a0a9c0',
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
          color: '#ffffff',
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          }
        },
        title: {
          display: true,
          text: 'Products/Services',
          color: '#a0a9c0',
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
        borderRadius: 8,
      }
    }
  };

  const totalProducts = Object.values(messageData).reduce((a, b) => a + b, 0);
  const topProduct = sortedEntries.length > 0 ? sortedEntries[0] : null;

  return (
    <div className="modern-card fade-in">
      <h3 className="title-small mb-6">Products Breakdown</h3>
      
      <div style={{ height: `${height}px`, marginBottom: '1rem' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* Summary stats */}
      <div style={{ 
        padding: '1rem',
        background: 'var(--bg-glass)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-1">
              {Object.keys(messageData).filter(key => key !== 'Unknown' && key !== '').length}
            </div>
            <div>Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-400 mb-1">
              {topProduct ? topProduct[1] : 0}
            </div>
            <div>Top Product Leads</div>
          </div>
        </div>
        {topProduct && (
          <div className="mt-3 text-center border-t border-white/10 pt-3">
            <span className="text-white font-medium text-sm">
              Most Popular: {formatProductName(topProduct[0])}
            </span>
          </div>
        )}
      </div>
    </div>
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
    .map(word => {
      // Keep certain abbreviations uppercase
      if (word.toUpperCase() === 'POS' || word.toUpperCase() === 'API') {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/v(\d+)/gi, 'v$1'); // Keep version formatting
}