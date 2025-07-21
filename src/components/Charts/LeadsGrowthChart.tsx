import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { DashboardData, Lead } from '../../lib/types';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, parseISO, isWithinInterval } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LeadsGrowthChartProps {
  data: DashboardData | null;
  loading?: boolean;
  height?: number;
}

type GroupingType = 'daily' | 'weekly' | 'monthly';

export default function LeadsGrowthChart({ data, loading = false, height = 300 }: LeadsGrowthChartProps) {
  const [grouping, setGrouping] = useState<GroupingType>('daily');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  // Get default date range (last 30 days)
  const defaultDateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return [start, end] as [Date, Date];
  }, []);

  const currentDateRange = dateRange || defaultDateRange;

  // Filter leads by date range using Malaysian timezone (consistent with other charts)
  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    
    const malaysianOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    
    // Convert date range to Malaysian timezone date strings for comparison
    const startMalaysian = new Date(currentDateRange[0].getTime() + malaysianOffset);
    const endMalaysian = new Date(currentDateRange[1].getTime() + malaysianOffset);
    const startDateStr = startMalaysian.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDateStr = endMalaysian.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return data.leads.filter(lead => {
      try {
        const leadDateUTC = new Date(lead.createDate);
        const leadDateMalaysian = new Date(leadDateUTC.getTime() + malaysianOffset);
        const leadDateStr = leadDateMalaysian.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Compare date strings: leadDate >= startDate && leadDate <= endDate
        return leadDateStr >= startDateStr && leadDateStr <= endDateStr;
      } catch (error) {
        return false;
      }
    });
  }, [data?.leads, currentDateRange]);

  // Calculate chart data based on grouping
  const chartData = useMemo(() => {
    const [start, end] = currentDateRange;
    
    let intervals: Date[] = [];
    let formatString = '';
    
    switch (grouping) {
      case 'daily':
        intervals = eachDayOfInterval({ start, end });
        formatString = 'MMM dd';
        break;
      case 'weekly':
        intervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }); // Monday start
        formatString = 'MMM dd';
        break;
      case 'monthly':
        intervals = eachMonthOfInterval({ start, end });
        formatString = 'MMM yyyy';
        break;
    }

    const labels = intervals.map(date => format(date, formatString));
    const leadCounts = intervals.map(intervalStart => {
      let intervalEnd: Date;
      
      switch (grouping) {
        case 'daily':
          intervalEnd = endOfDay(intervalStart);
          break;
        case 'weekly':
          intervalEnd = endOfWeek(intervalStart, { weekStartsOn: 1 });
          break;
        case 'monthly':
          intervalEnd = endOfMonth(intervalStart);
          break;
      }

      return filteredLeads.filter(lead => {
        try {
          const leadDate = parseISO(lead.createDate);
          return isWithinInterval(leadDate, {
            start: intervalStart,
            end: intervalEnd
          });
        } catch (error) {
          return false;
        }
      }).length;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Leads',
          data: leadCounts,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#3b82f6',
          pointHoverBorderColor: '#ffffff',
        }
      ]
    };
  }, [filteredLeads, currentDateRange, grouping]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return `${context[0].label}`;
          },
          label: (context: any) => {
            const count = context.parsed.y;
            return `${count} lead${count !== 1 ? 's' : ''}`;
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
          }
        },
        title: {
          display: true,
          text: 'Number of Leads',
          color: '#a0a9c0',
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#a0a9c0',
          maxRotation: 45,
          font: {
            size: 11
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (loading) {
    return (
      <div className="modern-card">
        <div className="flex items-center justify-between mb-6">
          <div className="w-48 h-6 skeleton"></div>
          <div className="flex gap-3">
            <div className="w-24 h-8 skeleton rounded-lg"></div>
            <div className="w-48 h-8 skeleton rounded-lg"></div>
          </div>
        </div>
        <div className="w-full skeleton" style={{ height: `${height}px` }}></div>
        <div className="mt-4 text-center">
          <div className="w-64 h-4 skeleton mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="modern-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="title-small">Leads Growth Over Time</h3>
          <div className="flex gap-3">
            <select className="modern-select" value={grouping} onChange={(e) => setGrouping(e.target.value as GroupingType)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input 
              type="date" 
              className="modern-input"
              placeholder="Date Range"
            />
          </div>
        </div>
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

  return (
    <div className="modern-card fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="title-small">Leads Growth Over Time</h3>
        <div className="flex gap-3">
          <select
            value={grouping}
            onChange={(e) => setGrouping(e.target.value as GroupingType)}
            className="modern-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={currentDateRange[0].toISOString().split('T')[0]}
              onChange={(e) => {
                const newStart = new Date(e.target.value);
                setDateRange([newStart, currentDateRange[1]]);
              }}
              className="modern-input text-sm"
              style={{ width: '140px' }}
            />
            <input
              type="date"
              value={currentDateRange[1].toISOString().split('T')[0]}
              onChange={(e) => {
                const newEnd = new Date(e.target.value);
                setDateRange([currentDateRange[0], newEnd]);
              }}
              className="modern-input text-sm"
              style={{ width: '140px' }}
            />
          </div>
        </div>
      </div>
      
      <div style={{ height: `${height}px`, marginBottom: '1rem' }}>
        <Line data={chartData} options={options} />
      </div>
      
      <div className="text-center text-secondary text-sm">
        Showing {filteredLeads.length} leads from {format(currentDateRange[0], 'MMM dd, yyyy')} to {format(currentDateRange[1], 'MMM dd, yyyy')}
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
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-1">
              {filteredLeads.length}
            </div>
            <div>Filtered Leads</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-400 mb-1">
              {Math.max(...chartData.datasets[0].data)}
            </div>
            <div>Peak Day</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-400 mb-1">
              {filteredLeads.length > 0 ? Math.round(filteredLeads.length / chartData.labels.length) : 0}
            </div>
            <div>Daily Average</div>
          </div>
        </div>
      </div>
    </div>
  );
}