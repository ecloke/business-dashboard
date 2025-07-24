import React from 'react';
import { MarketingDashboardData } from '../lib/types';

interface MarketingMetricsTableProps {
  data: MarketingDashboardData;
  loading?: boolean;
}

/**
 * Marketing Metrics Table Component
 * Displays all marketing metrics in a clean table format with Total, Meta, and Google SEM columns
 */
export default function MarketingMetricsTable({ data, loading }: MarketingMetricsTableProps) {
  if (loading) {
    return (
      <div className="modern-card">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 rounded mb-4"></div>
            {[...Array(11)].map((_, i) => (
              <div key={i} className="h-8 bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { totalMetrics, channelBreakdown } = data;
  const metaData = channelBreakdown['Meta (Facebook)'] || null;
  const googleData = channelBreakdown['Google Ads'] || null;

  const formatNumber = (num: number, type: 'currency' | 'percentage' | 'number' = 'number'): string => {
    if (type === 'currency') {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (type === 'percentage') {
      return `${num.toFixed(2)}%`;
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const tableRows = [
    {
      label: 'Impressions',
      total: formatNumber(totalMetrics.impressions),
      meta: metaData ? formatNumber(metaData.impressions) : '-',
      google: googleData ? formatNumber(googleData.impressions) : '-'
    },
    {
      label: 'Clicks',
      total: formatNumber(totalMetrics.clicks),
      meta: metaData ? formatNumber(metaData.clicks) : '-',
      google: googleData ? formatNumber(googleData.clicks) : '-'
    },
    {
      label: 'CTR %',
      total: formatNumber(totalMetrics.ctr, 'percentage'),
      meta: metaData ? formatNumber(metaData.ctr, 'percentage') : '-',
      google: googleData ? formatNumber(googleData.ctr, 'percentage') : '-'
    },
    {
      label: 'Leads',
      total: formatNumber(totalMetrics.leads),
      meta: metaData ? formatNumber(metaData.leads) : '-',
      google: googleData ? formatNumber(googleData.leads) : '-'
    },
    {
      label: 'Conversion Rate %',
      total: formatNumber(totalMetrics.conversionRate, 'percentage'),
      meta: metaData ? formatNumber(metaData.conversionRate, 'percentage') : '-',
      google: googleData ? formatNumber(googleData.conversionRate, 'percentage') : '-'
    },
    {
      label: 'Spend',
      total: formatNumber(totalMetrics.spend, 'currency'),
      meta: metaData ? formatNumber(metaData.spend, 'currency') : '-',
      google: googleData ? formatNumber(googleData.spend, 'currency') : '-'
    },
    {
      label: 'Cost per Lead',
      total: formatNumber(totalMetrics.costPerConversion, 'currency'),
      meta: metaData ? formatNumber(metaData.costPerConversion, 'currency') : '-',
      google: googleData ? formatNumber(googleData.costPerConversion, 'currency') : '-'
    },
    {
      label: 'No. of Closed Deals',
      total: formatNumber(totalMetrics.closedDeals),
      meta: metaData ? formatNumber(metaData.closedDeals) : '-',
      google: googleData ? formatNumber(googleData.closedDeals) : '-'
    },
    {
      label: 'Close Deal Amount',
      total: formatNumber(totalMetrics.closedDealAmount, 'currency'),
      meta: metaData ? formatNumber(metaData.closedDealAmount, 'currency') : '-',
      google: googleData ? formatNumber(googleData.closedDealAmount, 'currency') : '-'
    },
    {
      label: 'Profit',
      total: formatNumber(totalMetrics.profit, 'currency'),
      meta: metaData ? formatNumber(metaData.profit, 'currency') : '-',
      google: googleData ? formatNumber(googleData.profit, 'currency') : '-',
      isProfit: true
    },
    {
      label: 'CAC',
      total: formatNumber(totalMetrics.cac, 'currency'),
      meta: metaData ? formatNumber(metaData.cac, 'currency') : '-',
      google: googleData ? formatNumber(googleData.cac, 'currency') : '-'
    }
  ];

  return (
    <div className="modern-card overflow-hidden">
      {/* Header */}
      <div 
        className="px-8 py-6 border-b border-border/20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)'
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
        </div>
        
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              📊 Marketing Performance
            </h3>
            <p className="text-white/80 text-base font-medium mt-1">
              Real-time ROI insights across all channels
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <span className="text-white text-sm font-semibold">Live Data</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Header */}
          <thead>
            <tr 
              className="border-b-2 border-purple-500/20"
              style={{
                background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(102, 126, 234, 0.1) 100%)',
              }}
            >
              <th className="px-8 py-6 text-left relative group">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
                  <div>
                    <div className="text-lg font-black text-white uppercase tracking-wide">
                      Metric
                    </div>
                    <div className="text-xs text-purple-200 font-medium">Performance Indicator</div>
                  </div>
                </div>
              </th>
              <th className="px-8 py-6 text-right relative group">
                <div className="flex items-center justify-end gap-3">
                  <div>
                    <div className="text-lg font-black text-white uppercase tracking-wide">
                      🎯 Total
                    </div>
                    <div className="text-xs text-purple-200 font-medium">Combined Results</div>
                  </div>
                  <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-blue-500 rounded-full"></div>
                </div>
              </th>
              <th className="px-8 py-6 text-right relative group">
                <div className="flex items-center justify-end gap-3">
                  <div>
                    <div className="text-lg font-black text-white uppercase tracking-wide">
                      📱 Meta
                    </div>
                    <div className="text-xs text-purple-200 font-medium">Facebook Ads</div>
                  </div>
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
                </div>
              </th>
              <th className="px-8 py-6 text-right relative group">
                <div className="flex items-center justify-end gap-3">
                  <div>
                    <div className="text-lg font-black text-white uppercase tracking-wide">
                      🔍 Google
                    </div>
                    <div className="text-xs text-purple-200 font-medium">Search Ads</div>
                  </div>
                  <div className="w-1 h-8 bg-gradient-to-b from-red-400 to-orange-500 rounded-full"></div>
                </div>
              </th>
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {tableRows.map((row, index) => (
              <tr 
                key={row.label} 
                className="group border-b border-border/10 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 hover:z-10 relative"
                style={{
                  background: index % 2 === 0 
                    ? 'linear-gradient(90deg, rgba(30, 41, 59, 0.4) 0%, rgba(51, 65, 85, 0.2) 100%)' 
                    : 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                }}
              >
                <td className="px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r transition-all duration-300 ${
                      row.isProfit 
                        ? 'from-green-400 to-emerald-500 shadow-lg shadow-green-400/30' 
                        : 'from-blue-400 to-purple-500 shadow-lg shadow-blue-400/30'
                    } group-hover:scale-125 group-hover:shadow-xl`} />
                    <div>
                      <span className="text-base font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
                        {row.label}
                      </span>
                      {row.isProfit && (
                        <div className="text-xs text-purple-300 font-medium">Revenue Impact</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`px-8 py-5 whitespace-nowrap text-right relative ${
                  row.isProfit 
                    ? (totalMetrics.profit >= 0 ? 'text-green-400 font-black' : 'text-red-400 font-black')
                    : 'text-white font-bold'
                }`}>
                  <div className="flex items-center justify-end gap-2">
                    {row.isProfit && (
                      <div className={`w-2 h-2 rounded-full ${
                        totalMetrics.profit >= 0 ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'
                      }`} />
                    )}
                    <span className="text-lg tracking-wide">
                      {row.total}
                    </span>
                  </div>
                </td>
                <td className={`px-8 py-5 whitespace-nowrap text-right ${
                  row.isProfit && metaData
                    ? (metaData.profit >= 0 ? 'text-green-400 font-black' : 'text-red-400 font-black')
                    : 'text-blue-200 font-bold'
                }`}>
                  <div className="flex items-center justify-end gap-2">
                    {row.isProfit && metaData && (
                      <div className={`w-2 h-2 rounded-full ${
                        metaData.profit >= 0 ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'
                      }`} />
                    )}
                    <span className="text-lg tracking-wide">
                      {row.meta}
                    </span>
                  </div>
                </td>
                <td className={`px-8 py-5 whitespace-nowrap text-right ${
                  row.isProfit && googleData
                    ? (googleData.profit >= 0 ? 'text-green-400 font-black' : 'text-red-400 font-black')
                    : 'text-orange-200 font-bold'
                }`}>
                  <div className="flex items-center justify-end gap-2">
                    {row.isProfit && googleData && (
                      <div className={`w-2 h-2 rounded-full ${
                        googleData.profit >= 0 ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'
                      }`} />
                    )}
                    <span className="text-lg tracking-wide">
                      {row.google}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div 
        className="px-8 py-6 border-t-2 border-purple-500/20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 animate-pulse"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-ping"></div>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 absolute"></div>
            </div>
            <div>
              <span className="text-sm font-bold text-white">🔗 Live Google Sheets Integration</span>
              <div className="text-xs text-green-300 font-medium">Real-time data synchronization</div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white">
              📅 {new Date(data.lastUpdated).toLocaleString()}
            </p>
            <p className="text-xs text-purple-200">
              Auto-refresh every 5 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}