import React, { useState, useMemo } from 'react';
import { Card, Select, DatePicker, Row, Col, Skeleton } from 'antd';
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
import type { Dayjs } from 'dayjs';

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

const { RangePicker } = DatePicker;
const { Option } = Select;

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

  // Filter leads by date range
  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    
    return data.leads.filter(lead => {
      try {
        const leadDate = parseISO(lead.createDate);
        return isWithinInterval(leadDate, {
          start: startOfDay(currentDateRange[0]),
          end: endOfDay(currentDateRange[1])
        });
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
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1890ff',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#1890ff',
        borderWidth: 1,
        cornerRadius: 6,
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
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          stepSize: 1,
          color: '#666666',
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666666',
          maxRotation: 45,
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
      <Card 
        title="Leads Growth Over Time" 
        variant="borderless"
        style={{ 
          height: height + 100,
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
        }}
      >
        <Skeleton.Input active style={{ width: '100%', height: height }} />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card 
        title="Leads Growth Over Time" 
        variant="borderless"
        style={{ 
          height: height + 100,
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
        }}
      >
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

  return (
    <Card 
      title="Leads Growth Over Time" 
      variant="borderless"
      style={{ 
        height: height + 100,
        borderRadius: '8px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}
      extra={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Select
            value={grouping}
            onChange={setGrouping}
            style={{ width: 100, minWidth: 100 }}
            size="small"
            placeholder="Group by"
          >
            <Option value="daily">Daily</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
          </Select>
          <RangePicker
            value={dateRange ? [dateRange[0] as any, dateRange[1] as any] : null}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([(dates[0] as any).toDate(), (dates[1] as any).toDate()]);
              } else {
                setDateRange(null);
              }
            }}
            size="small"
            style={{ width: 200, minWidth: 200 }}
            placeholder={['Start date', 'End date']}
          />
        </div>
      }
    >
      <div style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
      <div style={{ marginTop: '12px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
        Showing {filteredLeads.length} leads from {format(currentDateRange[0], 'MMM dd, yyyy')} to {format(currentDateRange[1], 'MMM dd, yyyy')}
      </div>
    </Card>
  );
}