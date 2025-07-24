import React, { useState, useEffect } from 'react';
import DateRangeFilter from './DateRangeFilter';
import MarketingMetricsTable from './MarketingMetricsTable';
import { MarketingDashboardData, DateRange } from '../lib/types';

interface MarketingROIDashboardProps {
  className?: string;
}

export default function MarketingROIDashboard({ className }: MarketingROIDashboardProps) {
  const [marketingData, setMarketingData] = useState<MarketingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
    start.setHours(0, 0, 0, 0);
    return { start, end };
  });

  /**
   * Load marketing data from Google Sheets API
   */
  const loadMarketingData = async (force = false) => {
    try {
      setRefreshing(true);
      setError(null);

      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      
      const url = `/api/google-sheets-data?start=${startDate}&end=${endDate}${force ? '&force=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load marketing data');
      }

      setMarketingData(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error loading marketing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load marketing data');
      
      // Set mock data for development
      setMarketingData({
        totalMetrics: {
          spend: 15420.50,
          leads: 187,
          clicks: 2453,
          impressions: 28967,
          costPerConversion: 82.46,
          conversionRate: 7.62,
          ctr: 8.47,
          closedDeals: 8,
          closedDealAmount: 25000.00,
          profit: 9579.50,
          cac: 1927.56
        },
        channelBreakdown: {
          'Meta (Facebook)': {
            spend: 8750.25,
            leads: 112,
            clicks: 1567,
            impressions: 18432,
            costPerConversion: 78.13,
            conversionRate: 7.15,
            ctr: 8.51,
            closedDeals: 5,
            closedDealAmount: 15000.00,
            profit: 6249.75,
            cac: 1750.05
          },
          'Google Ads': {
            spend: 6670.25,
            leads: 75,
            clicks: 886,
            impressions: 10535,
            costPerConversion: 88.94,
            conversionRate: 8.47,
            ctr: 8.41,
            closedDeals: 3,
            closedDealAmount: 10000.00,
            profit: 3329.75,
            cac: 2223.42
          }
        },
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        },
        lastUpdated: new Date().toISOString()
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Manual refresh handler
   */
  const handleRefresh = async () => {
    await loadMarketingData(true);
  };

  /**
   * Date range change handler
   */
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  // Load data when component mounts or date range changes
  useEffect(() => {
    loadMarketingData(false);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-secondary">Loading marketing data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="modern-card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="title-large text-gradient mb-2">
              💰 Marketing ROI Analytics
            </h1>
            {lastUpdated && (
              <p className="text-secondary text-sm">
                Last updated: {lastUpdated.toLocaleString('en-MY', {
                  timeZone: 'Asia/Kuala_Lumpur',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
            {error && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-red-400 text-sm">
                  ⚠️ Using sample data: {error}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group p-3 rounded-xl transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: refreshing 
                ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' 
                : 'var(--bg-glass)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
            title="Refresh marketing data"
          >
            <div className="flex items-center gap-2">
              <svg 
                className={`w-5 h-5 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              <span className={`text-sm font-medium ${refreshing ? 'text-white' : 'text-primary group-hover:text-accent-blue'}`}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter 
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        loading={refreshing}
      />

      {/* Marketing Metrics Table */}
      {marketingData && (
        <div className="space-y-6">
          {/* Main Metrics Table */}
          <MarketingMetricsTable 
            data={marketingData}
            loading={refreshing}
          />

          {/* Footer Info */}
          <div className="modern-card text-center text-secondary">
            <div className="text-sm mb-2">
              Marketing ROI Dashboard powered by Google Sheets integration
            </div>
            <div className="text-xs">
              Data range: {new Date(marketingData.dateRange.start).toLocaleDateString('en-MY')} - {new Date(marketingData.dateRange.end).toLocaleDateString('en-MY')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}