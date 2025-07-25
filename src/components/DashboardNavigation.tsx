import React from 'react';
import { DashboardType } from '../lib/types';

interface DashboardNavigationProps {
  activeTab: DashboardType;
  onTabChange: (tab: DashboardType) => void;
}

export default function DashboardNavigation({ activeTab, onTabChange }: DashboardNavigationProps) {
  return (
    <div className="modern-card mb-6">
      <div className="flex items-center gap-4">
        <div className="text-xl">📊</div>
        <div className="flex-1">
          <h2 className="text-primary font-semibold text-xl mb-2">Business Dashboard</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange('leads-overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:transform hover:translateY(-1px) ${
                activeTab === 'leads-overview'
                  ? 'text-white shadow-lg'
                  : 'text-secondary hover:opacity-80'
              }`}
              style={{
                background: activeTab === 'leads-overview' 
                  ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' 
                  : 'var(--bg-glass)',
                border: activeTab === 'leads-overview' 
                  ? '1px solid var(--accent-blue)' 
                  : '1px solid var(--border)',
                backdropFilter: 'blur(10px)'
              }}
            >
              📈 Leads Overview
            </button>
            <button
              onClick={() => onTabChange('marketing-roi')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:transform hover:translateY(-1px) ${
                activeTab === 'marketing-roi'
                  ? 'text-white shadow-lg'
                  : 'text-secondary hover:opacity-80'
              }`}
              style={{
                background: activeTab === 'marketing-roi' 
                  ? 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))' 
                  : 'var(--bg-glass)',
                border: activeTab === 'marketing-roi' 
                  ? '1px solid var(--accent-green)' 
                  : '1px solid var(--border)',
                backdropFilter: 'blur(10px)'
              }}
            >
              💰 Marketing ROI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}