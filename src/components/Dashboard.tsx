import React, { useState, useEffect } from 'react';
import MetricsCards from './MetricsCards';
import TrafficSourceChart from './Charts/TrafficSourceChart';
import ProductsBreakdownChart from './Charts/ProductsBreakdownChart';
import LeadStatusChart from './Charts/LeadStatusChart';
import LeadsGrowthChart from './Charts/LeadsGrowthChart';
import RefreshButton from './RefreshButton';
import { DashboardData, Lead } from '../lib/types';
import { processCSVData } from '../lib/dataProcessor';
import initialData from '../data/initial_data.json';

interface DashboardProps {
  className?: string;
}

export default function Dashboard({ className }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load initial data from JSON file
   */
  const loadInitialData = () => {
    try {
      const leadsData = initialData as Lead[];
      const processedData = processCSVData(leadsData);
      
      setLeads(leadsData);
      setDashboardData(processedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh data from HubSpot API (via cache if available)
   */
  const refreshData = async (force = false) => {
    setRefreshing(true);
    setError(null);

    try {
      // Try to fetch from API first
      const response = await fetch('/api/hubspot-data', {
        method: force ? 'POST' : 'GET', // POST forces cache refresh
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const apiData = await response.json();
      
      if (apiData.success && apiData.data) {
        setLeads(apiData.leads || []);
        setDashboardData(apiData.data);
        setLastUpdated(new Date(apiData.lastUpdated || Date.now()));
      } else {
        throw new Error(apiData.message || 'API returned no data');
      }
    } catch (err) {
      console.warn('API refresh failed, using cached data:', err);
      
      // Fallback to initial data if API fails
      loadInitialData();
      setError('Using cached data - API refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    // Start with initial data
    loadInitialData();
    
    // Then try to refresh from API after a short delay
    setTimeout(() => {
      refreshData(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <div className="text-secondary">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="title-large text-gradient">
              HubSpot Lead Analytics
            </h1>
            {lastUpdated && (
              <p className="text-secondary text-sm">
                Last updated: {lastUpdated.toLocaleString('en-MY', {
                  timeZone: 'Asia/Kuala_Lumpur',
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })} MYT
              </p>
            )}
          </div>
          
          <RefreshButton 
            onRefresh={() => refreshData(true)}
            loading={refreshing}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="modern-card mb-6" style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderColor: 'rgba(239, 68, 68, 0.3)' 
        }}>
          <div className="flex items-center gap-3">
            <div className="text-red-400 text-xl">⚠️</div>
            <div>
              <div className="text-red-300 font-medium">Data Loading Notice</div>
              <div className="text-red-200 text-sm mt-1">{error}</div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-300 hover:text-red-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Metrics Cards Section */}
      <MetricsCards data={dashboardData} loading={refreshing} />

      {/* Charts Section */}
      <div className="grid-2 mb-8">
        <LeadsGrowthChart 
          data={dashboardData} 
          loading={refreshing} 
          height={320}
        />
        <LeadStatusChart 
          data={dashboardData} 
          loading={refreshing} 
          height={320}
        />
      </div>

      <div className="grid-2 mb-8">
        <TrafficSourceChart 
          data={dashboardData} 
          loading={refreshing} 
          height={300}
        />
        <ProductsBreakdownChart 
          data={dashboardData} 
          loading={refreshing} 
          height={300}
        />
      </div>


      {/* Footer Info */}
      <div className="modern-card text-center text-secondary">
        <div className="text-sm mb-2">
          This dashboard is built by an AI
        </div>
        <div className="text-xs">
          {dashboardData?.totalCount || 0} total leads tracked
        </div>
      </div>
    </div>
  );
}