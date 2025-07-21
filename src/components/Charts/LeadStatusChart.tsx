import React, { useState, useMemo } from 'react';
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
import { DashboardData, Lead } from '../../lib/types';
// Removed date-fns import - using native Date methods for Malaysian timezone

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface LeadStatusChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

type TimeFilter = 'today' | 'week' | 'month';

export default function LeadStatusChart({ data, loading = false, height = 300 }: LeadStatusChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  // Filter leads based on time period
  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];

    // Use Malaysian timezone (UTC+8) for filtering
    const malaysianOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const now = new Date();
    const malaysianNow = new Date(now.getTime() + malaysianOffset);

    const todayMalaysianStr = malaysianNow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Determine start date based on filter
    let startDate: Date;
    
    switch (timeFilter) {
      case 'today':
        // For today, use exact date string matching for precision
        return data.leads.filter(lead => {
          try {
            const leadDateUTC = new Date(lead.createDate);
            const leadDateMalaysian = new Date(leadDateUTC.getTime() + malaysianOffset);
            const leadDateStr = leadDateMalaysian.toISOString().split('T')[0];
            return leadDateStr === todayMalaysianStr;
          } catch {
            return false;
          }
        });
      case 'week':
        const dayOfWeek = malaysianNow.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
        startDate = new Date(malaysianNow.getFullYear(), malaysianNow.getMonth(), malaysianNow.getDate() - daysToSubtract);
        break;
      case 'month':
        startDate = new Date(malaysianNow.getFullYear(), malaysianNow.getMonth(), 1);
        break;
      default:
        // Fallback to beginning of month if timeFilter is somehow invalid
        startDate = new Date(malaysianNow.getFullYear(), malaysianNow.getMonth(), 1);
    }

    // Filter leads from start date onwards
    return data.leads.filter(lead => {
      try {
        const leadDateUTC = new Date(lead.createDate);
        const leadDateMalaysian = new Date(leadDateUTC.getTime() + malaysianOffset);
        
        return leadDateMalaysian >= startDate;
      } catch {
        return false;
      }
    });
  }, [data?.leads, timeFilter]);

  // Calculate status breakdown for filtered leads
  const statusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    if (!filteredLeads || filteredLeads.length === 0) {
      return breakdown;
    }
    
    filteredLeads.forEach(lead => {
      const status = lead.leadStatus || 'Unknown';
      breakdown[status] = (breakdown[status] || 0) + 1;
    });

    return breakdown;
  }, [filteredLeads]);

  if (loading) {
    return (
      <div className="modern-card">
        <div className="flex items-center justify-between mb-6">
          <div className="w-48 h-6 skeleton"></div>
          <div className="w-32 h-8 skeleton rounded-lg"></div>
        </div>
        <div className="w-full skeleton" style={{ height: `${height}px` }}></div>
        <div className="mt-4 space-y-2">
          <div className="w-full h-4 skeleton"></div>
          <div className="w-3/4 h-4 skeleton"></div>
        </div>
      </div>
    );
  }

  if (!data || Object.keys(statusBreakdown).length === 0) {
    return (
      <div className="modern-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="title-small">Lead Status Overview</h3>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="modern-select"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div style={{ 
          height: `${height}px`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          No data available for the selected period
        </div>
      </div>
    );
  }

  // Sort statuses by count (descending) and prepare chart data
  const sortedEntries = Object.entries(statusBreakdown)
    .sort(([, a], [, b]) => b - a);

  const labels = sortedEntries.map(([status]) => formatStatusLabel(status));
  const values = sortedEntries.map(([, count]) => count);
  const originalLabels = sortedEntries.map(([status]) => status); // Keep original for lookups

  // Color mapping for different lead statuses
  const getStatusColor = (status: string): { bg: string; border: string } => {
    const colorMap: Record<string, { bg: string; border: string }> = {
      'Won': { bg: 'rgba(34, 197, 94, 0.8)', border: '#22c55e' },
      'Lost': { bg: 'rgba(239, 68, 68, 0.8)', border: '#ef4444' },
      'New': { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6' },
      'Contacted': { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' },
      'Qualified': { bg: 'rgba(139, 92, 246, 0.8)', border: '#8b5cf6' },
      'Unqualified': { bg: 'rgba(107, 114, 128, 0.8)', border: '#6b7280' },
      'In Progress': { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6' },
      'Bad Timing': { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' },
      'RFQ Only': { bg: 'rgba(139, 92, 246, 0.8)', border: '#8b5cf6' },
      'Unknown': { bg: 'rgba(156, 163, 175, 0.8)', border: '#9ca3af' },
      'No Status': { bg: 'rgba(156, 163, 175, 0.8)', border: '#9ca3af' }
    };
    
    return colorMap[status] || { bg: 'rgba(107, 114, 128, 0.8)', border: '#6b7280' };
  };

  // Use reliable color arrays
  const statusColors = [
    'rgba(34, 197, 94, 0.8)',   // Green
    'rgba(239, 68, 68, 0.8)',   // Red
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(245, 158, 11, 0.8)',  // Orange
    'rgba(139, 92, 246, 0.8)',  // Purple
    'rgba(236, 72, 153, 0.8)',  // Pink
    'rgba(20, 184, 166, 0.8)',  // Teal
    'rgba(107, 114, 128, 0.8)'  // Gray
  ];

  const statusBorderColors = [
    '#22c55e', '#ef4444', '#3b82f6', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'
  ];

  const chartData = {
    labels,
    datasets: [{
      label: 'Leads',
      data: values,
      backgroundColor: statusColors.slice(0, values.length || 1),
      borderColor: statusBorderColors.slice(0, values.length || 1),
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y' as const, // This makes it horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
            return `${context[0].label} Leads`;
          },
          label: (context) => {
            const dataIndex = context.dataIndex;
            const value = values[dataIndex];
            const originalStatus = originalLabels[dataIndex];
            const formattedLabel = formatStatusLabel(originalStatus);
            const total = values.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${formattedLabel}: ${value} leads (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
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
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#ffffff',
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

  const wonLeads = statusBreakdown['WON'] || 0;
  const lostLeads = statusBreakdown['LOST'] || 0;
  const totalLeads = filteredLeads.length;
  
  // Calculate win rate using the same logic as won/lost ratio display
  const totalWonLost = wonLeads + lostLeads;
  const conversionRate = totalWonLost > 0 ? Math.round((wonLeads / totalWonLost) * 100) : 0;

  const getTimeFilterLabel = (): string => {
    switch (timeFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
    }
  };

  return (
    <div className="modern-card fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="title-small">Lead Status Overview</h3>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          className="modern-select"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      
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
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-1">
              {totalLeads}
            </div>
            <div>Total Leads ({getTimeFilterLabel()})</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold mb-1 ${
              conversionRate >= 20 ? 'text-green-400' : 
              conversionRate >= 10 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {conversionRate}%
            </div>
            <div>Win Rate (Won/Total)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-400 mb-1">
              {wonLeads}/{lostLeads}
            </div>
            <div>Won/Lost Ratio</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format status labels for better display
 */
function formatStatusLabel(status: string): string {
  if (!status || status === 'Unknown') return 'No Status';
  
  // Handle specific status mappings
  const statusMappings: Record<string, string> = {
    'WON': 'Won',
    'LOST': 'Lost',
    'NEW': 'New',
    'CONTACTED': 'Contacted',
    'ATTEMPTED_TO_CONTACT': 'Attempted To Contact',
    'QUALIFIED': 'Qualified',
    'UNQUALIFIED': 'Unqualified',
    'IN_PROGRESS': 'In Progress',
    'BAD_TIMING': 'Bad Timing',
    'RFQ_ONLY': 'RFQ Only',
    'OPEN_DEAL': 'Open Deal',
    'CONNECTED': 'Connected'
  };
  
  // Check if we have a specific mapping
  const upperStatus = status.toUpperCase();
  if (statusMappings[upperStatus]) {
    return statusMappings[upperStatus];
  }
  
  // For other statuses, format by splitting underscores and capitalizing words
  return status.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}