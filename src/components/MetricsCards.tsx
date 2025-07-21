import React from 'react';
import { Row, Col, Card, Statistic, Skeleton, Tooltip } from 'antd';
import { 
  UserOutlined, 
  RiseOutlined, 
  TrophyOutlined, 
  CloseCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { DashboardData } from '../lib/types';

interface MetricsCardsProps {
  data: DashboardData | null;
  loading?: boolean;
}

export default function MetricsCards({ data, loading = false }: MetricsCardsProps) {
  // Calculate metrics from data
  const todaysLeads = data?.todaysLeads || 0;
  const topOriginalSource = getTopOriginalTrafficSource(data);
  const wonLeads = data?.wonLeads || 0;
  const lostLeads = data?.lostLeads || 0;
  const topProduct = getTopProduct(data);

  if (loading) {
    return (
      <Row gutter={[24, 16]}>
        {[...Array(5)].map((_, index) => (
          <Col xs={24} sm={12} lg={6} xl={4.8} key={index}>
            <Card 
              variant="borderless"
              style={{ 
                borderRadius: '8px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
              }}
            >
              <Skeleton.Input active style={{ width: '100%', height: '80px' }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[24, 16]}>
      {/* Today's Leads */}
      <Col xs={24} sm={12} lg={6} xl={4.8}>
        <Card 
          variant="borderless"
          hoverable
          style={{ 
            height: '100%',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}
        >
          <Statistic
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined style={{ color: '#1890ff' }} />
                Today's Leads
                <Tooltip title="Number of leads created today">
                  <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                </Tooltip>
              </span>
            }
            value={todaysLeads}
            valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: '600' }}
            suffix={
              <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
                New Today
              </div>
            }
          />
        </Card>
      </Col>

      {/* Top Traffic Source (Original) */}
      <Col xs={24} sm={12} lg={6} xl={4.8}>
        <Card 
          variant="borderless"
          hoverable
          style={{ 
            height: '100%',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}
        >
          <Statistic
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiseOutlined style={{ color: '#52c41a' }} />
                Top Traffic Source
                <Tooltip title="Highest performing original traffic source by lead count">
                  <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                </Tooltip>
              </span>
            }
            value={`${topOriginalSource.percentage}%`}
            valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: '600' }}
            suffix={
              <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
                {topOriginalSource.name} ({topOriginalSource.count} leads)
              </div>
            }
          />
        </Card>
      </Col>

      {/* Won Leads */}
      <Col xs={24} sm={12} lg={6} xl={4.8}>
        <Card 
          variant="borderless"
          hoverable
          style={{ 
            height: '100%',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}
        >
          <Statistic
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                Won Leads
                <Tooltip title="Number of leads with WON status">
                  <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                </Tooltip>
              </span>
            }
            value={wonLeads}
            valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: '600' }}
            suffix={
              <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
                Successful
              </div>
            }
          />
        </Card>
      </Col>

      {/* Lost Leads */}
      <Col xs={24} sm={12} lg={6} xl={4.8}>
        <Card 
          variant="borderless"
          hoverable
          style={{ 
            height: '100%',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}
        >
          <Statistic
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                Lost Leads
                <Tooltip title="Number of leads with LOST status">
                  <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                </Tooltip>
              </span>
            }
            value={lostLeads}
            valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: '600' }}
            suffix={
              <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                Unsuccessful
              </div>
            }
          />
        </Card>
      </Col>

      {/* Top Products */}
      <Col xs={24} sm={12} lg={6} xl={4.8}>
        <Card 
          variant="borderless"
          hoverable
          style={{ 
            height: '100%',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}
        >
          <Statistic
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrophyOutlined style={{ color: '#faad14' }} />
                Top Product
                <Tooltip title="Most popular product/message from leads">
                  <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                </Tooltip>
              </span>
            }
            value={topProduct.count}
            valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: '600' }}
            suffix={
              <div style={{ fontSize: '12px', color: '#faad14', marginTop: '4px' }}>
                {topProduct.name}
              </div>
            }
          />
        </Card>
      </Col>
    </Row>
  );
}

/**
 * Get the top performing original traffic source
 */
function getTopOriginalTrafficSource(data: DashboardData | null): {
  name: string;
  count: number;
  percentage: number;
} {
  if (!data || !data.originalSourceBreakdown) {
    return { name: 'Unknown', count: 0, percentage: 0 };
  }

  const sources = Object.entries(data.originalSourceBreakdown);
  if (sources.length === 0) {
    return { name: 'No data', count: 0, percentage: 0 };
  }

  // Find the source with the highest count
  const topSource = sources.reduce((max, current) => {
    return current[1] > max[1] ? current : max;
  });

  const [name, count] = topSource;
  const percentage = data.totalCount > 0 ? Math.round((count / data.totalCount) * 100) : 0;

  return {
    name: formatSourceName(name),
    count,
    percentage
  };
}

/**
 * Get the top product/message
 */
function getTopProduct(data: DashboardData | null): {
  name: string;
  count: number;
} {
  if (!data || !data.topProducts || data.topProducts.length === 0) {
    return { name: 'No data', count: 0 };
  }

  const topProduct = data.topProducts[0];
  return {
    name: topProduct.name,
    count: topProduct.count
  };
}


/**
 * Format source names for better display
 */
function formatSourceName(source: string): string {
  const sourceMap: Record<string, string> = {
    'Paid Social': 'Facebook',
    'Direct Traffic': 'Direct',
    'Paid Search': 'Google',
    'Organic Search': 'Organic',
    'Other': 'Other'
  };

  return sourceMap[source] || source;
}


/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Unknown';
  }
}