import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Space, Typography } from 'antd';
import { 
  ReloadOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  loading?: boolean;
  lastUpdated?: Date | null;
  autoRefresh?: boolean;
  autoRefreshInterval?: number; // minutes
}

export default function RefreshButton({
  onRefresh,
  loading = false,
  lastUpdated,
  autoRefresh = false,
  autoRefreshInterval = 10
}: RefreshButtonProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(0);

  /**
   * Calculate time ago string
   */
  const calculateTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  /**
   * Calculate countdown for auto refresh
   */
  const calculateCountdown = (date: Date): number => {
    if (!autoRefresh) return 0;
    
    const nextRefresh = new Date(date.getTime() + (autoRefreshInterval * 60 * 1000));
    const now = new Date();
    const diffMs = nextRefresh.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    
    return Math.max(0, diffMinutes);
  };

  /**
   * Update time display every minute
   */
  useEffect(() => {
    if (!lastUpdated) return;

    const updateTime = () => {
      setTimeAgo(calculateTimeAgo(lastUpdated));
      setAutoRefreshCountdown(calculateCountdown(lastUpdated));
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated, autoRefresh, autoRefreshInterval]);

  /**
   * Auto refresh when countdown reaches 0
   */
  useEffect(() => {
    if (autoRefresh && autoRefreshCountdown === 0 && lastUpdated && !loading) {
      const timeSinceUpdate = new Date().getTime() - lastUpdated.getTime();
      const intervalMs = autoRefreshInterval * 60 * 1000;
      
      // Only auto-refresh if enough time has passed
      if (timeSinceUpdate >= intervalMs) {
        onRefresh();
      }
    }
  }, [autoRefreshCountdown, autoRefresh, autoRefreshInterval, lastUpdated, loading, onRefresh]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  /**
   * Get status icon based on last update time
   */
  const getStatusIcon = () => {
    if (loading) return <ReloadOutlined spin />;
    if (!lastUpdated) return <ExclamationCircleOutlined />;
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60));
    
    if (diffMinutes < 15) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (diffMinutes < 60) return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  /**
   * Get tooltip content
   */
  const getTooltipContent = () => {
    if (loading) return 'Refreshing data from HubSpot...';
    if (!lastUpdated) return 'No data available - click to refresh';
    
    const formattedTime = lastUpdated.toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: 'short', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let tooltip = `Last updated: ${formattedTime} MYT`;
    
    if (autoRefresh && autoRefreshCountdown > 0) {
      tooltip += `\nAuto-refresh in ${autoRefreshCountdown} minutes`;
    }
    
    return tooltip;
  };

  /**
   * Get button type based on data freshness
   */
  const getButtonType = () => {
    if (loading) return 'primary';
    if (!lastUpdated) return 'primary';
    
    const diffMinutes = Math.floor((new Date().getTime() - lastUpdated.getTime()) / (1000 * 60));
    if (diffMinutes > 60) return 'primary'; // Red for stale data
    return 'default';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Status indicator with time */}
      {lastUpdated && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '12px'
        }}>
          {getStatusIcon()}
          <div>
            <Text style={{ color: '#595959', fontSize: '12px' }}>
              {timeAgo}
            </Text>
            {autoRefresh && autoRefreshCountdown > 0 && (
              <div style={{ color: '#8c8c8c', fontSize: '11px' }}>
                Auto-refresh: {autoRefreshCountdown}m
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refresh button */}
      <Tooltip title={getTooltipContent()} placement="bottomRight">
        <Button
          type={getButtonType()}
          icon={<ReloadOutlined spin={loading} />}
          onClick={handleRefresh}
          loading={loading}
          size="middle"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Tooltip>
    </div>
  );
}