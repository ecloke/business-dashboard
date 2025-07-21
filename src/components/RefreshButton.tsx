import React from 'react';

interface RefreshButtonProps {
  onRefresh: () => void;
  loading?: boolean;
  lastUpdated?: Date | null;
}

export default function RefreshButton({ onRefresh, loading = false, lastUpdated }: RefreshButtonProps) {
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-xs text-muted">
          Last refresh
        </div>
        <div className="text-sm text-secondary">
          {formatTimeAgo(lastUpdated)}
        </div>
      </div>
      
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`modern-btn modern-btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <>
            <div className="loading-spinner"></div>
            Refreshing...
          </>
        ) : (
          <>
            <span className="text-lg">🔄</span>
            Refresh Data
          </>
        )}
      </button>
    </div>
  );
}