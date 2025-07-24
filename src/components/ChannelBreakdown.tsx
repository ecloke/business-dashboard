import React, { useState } from 'react';
import { ChannelBreakdown as ChannelBreakdownType, MarketingMetrics } from '../lib/types';

interface ChannelBreakdownProps {
  data: ChannelBreakdownType;
  loading?: boolean;
}

interface ChannelCardProps {
  channel: string;
  metrics: MarketingMetrics;
  isExpanded: boolean;
  onToggle: () => void;
}

function ChannelCard({ channel, metrics, isExpanded, onToggle }: ChannelCardProps) {
  const getChannelIcon = (channelName: string): string => {
    const name = channelName.toLowerCase();
    if (name.includes('meta') || name.includes('facebook')) return '📘';
    if (name.includes('google')) return '🔍';
    if (name.includes('instagram')) return '📷';
    if (name.includes('linkedin')) return '💼';
    if (name.includes('tiktok')) return '🎵';
    if (name.includes('youtube')) return '📺';
    if (name.includes('email')) return '📧';
    if (name.includes('organic')) return '🌱';
    if (name.includes('direct')) return '🎯';
    if (name.includes('referral')) return '🔗';
    return '📊';
  };

  return (
    <div 
      className="border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* Channel Header */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={onToggle}
        style={{ background: 'var(--bg-glass)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getChannelIcon(channel)}</span>
            <div>
              <h4 className="text-primary font-semibold">{channel}</h4>
              <p className="text-secondary text-sm">
                {metrics.leads} leads • ${metrics.spend.toLocaleString('en-MY', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })} spent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-primary font-semibold">
                ${metrics.costPerConversion.toFixed(2)}
              </div>
              <div className="text-secondary text-xs">Cost/Lead</div>
            </div>
            <svg 
              className={`w-5 h-5 text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary mb-1">
                ${metrics.spend.toLocaleString('en-MY', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </div>
              <div className="text-xs text-secondary">Total Spend</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-primary mb-1">
                {metrics.leads.toLocaleString()}
              </div>
              <div className="text-xs text-secondary">Leads Generated</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-primary mb-1">
                {metrics.clicks.toLocaleString()}
              </div>
              <div className="text-xs text-secondary">Total Clicks</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-primary mb-1">
                {metrics.impressions.toLocaleString()}
              </div>
              <div className="text-xs text-secondary">Impressions</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-primary mb-1">
                {metrics.conversionRate.toFixed(2)}%
              </div>
              <div className="text-xs text-secondary">Conversion Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-primary mb-1">
                {metrics.ctr.toFixed(2)}%
              </div>
              <div className="text-xs text-secondary">Click-Through Rate</div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">Performance Score:</span>
              <div className="flex items-center gap-2">
                {metrics.costPerConversion < 100 && metrics.conversionRate > 5 ? (
                  <>
                    <span className="text-green-400">🟢 Excellent</span>
                  </>
                ) : metrics.costPerConversion < 150 && metrics.conversionRate > 3 ? (
                  <>
                    <span className="text-yellow-400">🟡 Good</span>
                  </>
                ) : (
                  <>
                    <span className="text-orange-400">🟠 Needs Optimization</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChannelBreakdown({ data, loading = false }: ChannelBreakdownProps) {
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

  const toggleChannel = (channel: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channel)) {
      newExpanded.delete(channel);
    } else {
      newExpanded.add(channel);
    }
    setExpandedChannels(newExpanded);
  };

  const toggleAllChannels = () => {
    const channels = Object.keys(data);
    if (expandedChannels.size === channels.length) {
      // All expanded, collapse all
      setExpandedChannels(new Set());
    } else {
      // Some or none expanded, expand all
      setExpandedChannels(new Set(channels));
    }
  };

  if (loading) {
    return (
      <div className="modern-card">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton w-48 h-6"></div>
          <div className="skeleton w-24 h-8"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-4" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-6 h-6 rounded"></div>
                  <div>
                    <div className="skeleton w-32 h-4 mb-2"></div>
                    <div className="skeleton w-24 h-3"></div>
                  </div>
                </div>
                <div className="skeleton w-16 h-8"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const channels = Object.keys(data);
  const hasData = channels.length > 0;

  if (!hasData) {
    return (
      <div className="modern-card text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-primary font-semibold text-xl mb-2">No Channel Data</h3>
        <p className="text-secondary">No marketing channel data available for the selected date range.</p>
      </div>
    );
  }

  // Sort channels by spend (descending)
  const sortedChannels = channels.sort((a, b) => data[b].spend - data[a].spend);

  return (
    <div className="modern-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-primary font-semibold text-xl mb-1">📈 Channel Performance</h3>
          <p className="text-secondary text-sm">
            {channels.length} channel{channels.length !== 1 ? 's' : ''} • 
            Click to expand details
          </p>
        </div>
        <button
          onClick={toggleAllChannels}
          className="px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-80"
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)'
          }}
        >
          {expandedChannels.size === channels.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="space-y-4">
        {sortedChannels.map(channel => (
          <ChannelCard
            key={channel}
            channel={channel}
            metrics={data[channel]}
            isExpanded={expandedChannels.has(channel)}
            onToggle={() => toggleChannel(channel)}
          />
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'var(--border)' }}>
        <div className="text-sm text-secondary">
          Total across all channels: ${Object.values(data).reduce((sum, metrics) => sum + metrics.spend, 0).toLocaleString('en-MY', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })} spent • {Object.values(data).reduce((sum, metrics) => sum + metrics.leads, 0)} leads generated
        </div>
      </div>
    </div>
  );
}