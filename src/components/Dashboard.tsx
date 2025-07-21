import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Typography, Alert, Spin } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import MetricsCards from './MetricsCards';
import TrafficSourceChart from './Charts/TrafficSourceChart';
import ProductsBreakdownChart from './Charts/ProductsBreakdownChart';
import LeadStatusChart from './Charts/LeadStatusChart';
import LeadsGrowthChart from './Charts/LeadsGrowthChart';
import RecentLeadsTable from './Tables/RecentLeadsTable';
import RefreshButton from './RefreshButton';
import { DashboardData, Lead } from '../lib/types';
import { processCSVData } from '../lib/dataProcessor';
import initialData from '../data/initial_data.json';

const { Content } = Layout;
const { Title } = Typography;

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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div style={{ color: '#8c8c8c' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <Layout className={className} style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ 
        padding: '24px 24px 0', 
        background: '#f5f5f5',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '24px',
          padding: '0 0 24px 0',
          borderBottom: '1px solid #f0f0f0',
          background: 'transparent'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <Title 
                level={2} 
                style={{ 
                  margin: '0 0 8px 0', 
                  color: '#262626',
                  fontSize: '24px',
                  fontWeight: 600,
                  lineHeight: '32px'
                }}
              >
                HubSpot Lead Analytics
              </Title>
              {lastUpdated && (
                <div style={{ 
                  color: '#8c8c8c', 
                  fontSize: '14px',
                  lineHeight: '22px'
                }}>
                  Last updated: {lastUpdated.toLocaleString('en-MY', {
                    timeZone: 'Asia/Kuala_Lumpur',
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} MYT
                </div>
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
          <Alert
            message="Data Loading Notice"
            description={error}
            type="warning"
            showIcon
            closable
            style={{ marginBottom: '24px' }}
            onClose={() => setError(null)}
          />
        )}

        {/* Metrics Cards Section */}
        <div style={{ marginBottom: '24px' }}>
          <MetricsCards data={dashboardData} loading={refreshing} />
        </div>

        {/* Leads Growth Chart Section */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={16}>
            <LeadsGrowthChart 
              data={dashboardData} 
              loading={refreshing} 
              height={300}
            />
          </Col>
          <Col xs={24} lg={8}>
            <TrafficSourceChart 
              data={dashboardData} 
              loading={refreshing} 
              height={300}
            />
          </Col>
        </Row>

        {/* Analytics Charts Section */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={12}>
            <ProductsBreakdownChart 
              data={dashboardData} 
              loading={refreshing} 
              height={300}
            />
          </Col>
          <Col xs={24} lg={12}>
            <LeadStatusChart 
              data={dashboardData} 
              loading={refreshing} 
              height={300}
            />
          </Col>
        </Row>

        {/* Recent Leads Table Section */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <RecentLeadsTable 
              leads={leads} 
              loading={refreshing}
              pageSize={10}
            />
          </Col>
        </Row>

        {/* Footer Info */}
        <div style={{ 
          marginTop: '32px',
          padding: '16px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #f0f0f0',
          textAlign: 'center',
          color: '#8c8c8c',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '4px' }}>
            Dashboard powered by HubSpot CRM • Real-time lead analytics for Malaysian market
          </div>
          <div>
            Data automatically synced every 10 minutes • 
            {dashboardData?.totalCount || 0} total leads tracked
          </div>
        </div>
      </Content>
    </Layout>
  );
}