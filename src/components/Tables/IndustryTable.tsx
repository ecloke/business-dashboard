import React from 'react';
import { Card, Table, Progress, Typography, Skeleton, Tag } from 'antd';
import { ShopOutlined, TrophyOutlined, RiseOutlined } from '@ant-design/icons';
import { DashboardData } from '../../lib/types';

const { Title } = Typography;

interface IndustryTableProps {
  data: DashboardData | null;
  loading?: boolean;
  showAll?: boolean;
}

interface IndustryData {
  industry: string;
  count: number;
  percentage: number;
  growth?: string;
  rank: number;
}

export default function IndustryTable({ 
  data, 
  loading = false, 
  showAll = false 
}: IndustryTableProps) {
  if (loading) {
    return (
      <Card className="dashboard-card" style={{ height: '100%' }}>
        <Title level={4} style={{ marginBottom: '16px' }}>Industry Breakdown</Title>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!data || !data.industryBreakdown) {
    return (
      <Card className="dashboard-card" style={{ height: '100%' }}>
        <Title level={4} style={{ marginBottom: '16px' }}>Industry Breakdown</Title>
        <div style={{ 
          textAlign: 'center', 
          color: '#8c8c8c', 
          padding: '48px 0' 
        }}>
          No industry data available
        </div>
      </Card>
    );
  }

  // Prepare industry data
  const industryBreakdown = data.industryBreakdown;
  const totalLeads = Object.values(industryBreakdown).reduce((sum, count) => sum + count, 0);
  
  const industryData: IndustryData[] = Object.entries(industryBreakdown)
    .map(([industry, count], index) => ({
      industry: formatIndustryName(industry),
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
      growth: getGrowthIndicator(industry, count),
      rank: index + 1
    }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .map((item, index) => ({ ...item, rank: index + 1 })); // Re-assign ranks after sorting

  // Show top 5 by default, all if showAll is true
  const displayData = showAll ? industryData : industryData.slice(0, 5);

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      render: (record: IndustryData) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: getRankColor(record.rank),
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {record.rank}
        </div>
      ),
      width: 60,
      align: 'center' as const,
    },
    {
      title: 'Industry',
      key: 'industry',
      render: (record: IndustryData) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShopOutlined style={{ 
            color: getIndustryIconColor(record.industry),
            fontSize: '16px'
          }} />
          <div>
            <div style={{ 
              fontWeight: '500', 
              color: '#262626',
              marginBottom: '2px'
            }}>
              {record.industry}
            </div>
            {record.rank === 1 && (
              <Tag 
                icon={<TrophyOutlined />} 
                color="gold" 
                style={{ 
                  fontSize: '10px', 
                  margin: 0,
                  padding: '0 4px'
                }}
              >
                Top Performer
              </Tag>
            )}
          </div>
        </div>
      ),
      width: 180,
    },
    {
      title: 'Leads',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => (
        <div style={{ 
          fontWeight: '600', 
          color: '#262626',
          fontSize: '16px'
        }}>
          {count}
        </div>
      ),
      width: 80,
      sorter: (a: IndustryData, b: IndustryData) => a.count - b.count,
      align: 'center' as const,
    },
    {
      title: 'Share',
      key: 'percentage',
      render: (record: IndustryData) => (
        <div style={{ minWidth: '120px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '12px', color: '#262626', fontWeight: '500' }}>
              {record.percentage}%
            </span>
            {record.growth && (
              <span style={{ fontSize: '10px', color: '#52c41a' }}>
                <RiseOutlined /> {record.growth}
              </span>
            )}
          </div>
          <Progress 
            percent={record.percentage} 
            showInfo={false}
            strokeColor={getProgressColor(record.percentage)}
            trailColor="#f0f0f0"
            strokeWidth={6}
          />
        </div>
      ),
      width: 140,
      sorter: (a: IndustryData, b: IndustryData) => a.percentage - b.percentage,
    },
  ];

  return (
    <Card 
      className="dashboard-card fade-in" 
      style={{ height: '100%' }}
      hoverable
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <Title level={4} style={{ margin: 0, color: '#262626' }}>
          Industry Breakdown
        </Title>
        <div style={{ 
          fontSize: '12px', 
          color: '#8c8c8c',
          fontWeight: '500'
        }}>
          {industryData.length} industries
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={displayData}
        rowKey="industry"
        pagination={false}
        size="small"
        showHeader={false}
        rowClassName={(record, index) => 
          index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
        }
      />

      {/* Industry insights */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px',
        background: '#fafafa',
        borderRadius: '6px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div>
            <div style={{ color: '#8c8c8c' }}>Top Industry</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {getTopIndustry(industryData)}
            </div>
          </div>
          <div>
            <div style={{ color: '#8c8c8c' }}>Market Share</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {getTopMarketShare(industryData)}%
            </div>
          </div>
          <div>
            <div style={{ color: '#8c8c8c' }}>Diversity</div>
            <div style={{ color: '#262626', fontWeight: '500' }}>
              {getDiversityScore(industryData)}
            </div>
          </div>
          {!showAll && industryData.length > 5 && (
            <div>
              <div style={{ color: '#8c8c8c' }}>Others</div>
              <div style={{ color: '#262626', fontWeight: '500' }}>
                +{industryData.length - 5} more
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Format industry name for better display
 */
function formatIndustryName(industry: string): string {
  if (!industry || industry.toLowerCase() === 'null' || industry.toLowerCase() === 'undefined') {
    return 'Not Specified';
  }
  
  const industryMap: Record<string, string> = {
    'restaurants': 'Food & Beverage',
    'restaurant': 'Food & Beverage', 
    'food': 'Food & Beverage',
    'retail': 'Retail & Commerce',
    'ecommerce': 'E-commerce',
    'technology': 'Technology',
    'healthcare': 'Healthcare',
    'education': 'Education',
    'services': 'Professional Services',
    'manufacturing': 'Manufacturing',
    'hospitality': 'Hospitality',
    'beauty': 'Beauty & Wellness',
    'automotive': 'Automotive',
    'finance': 'Financial Services'
  };
  
  const lowerIndustry = industry.toLowerCase();
  for (const [key, value] of Object.entries(industryMap)) {
    if (lowerIndustry.includes(key)) {
      return value;
    }
  }
  
  // Capitalize first letter of each word
  return industry
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get rank color based on position
 */
function getRankColor(rank: number): string {
  switch (rank) {
    case 1: return '#faad14'; // Gold
    case 2: return '#8c8c8c'; // Silver  
    case 3: return '#d48806'; // Bronze
    default: return '#1890ff'; // Default blue
  }
}

/**
 * Get industry icon color
 */
function getIndustryIconColor(industry: string): string {
  const colorMap: Record<string, string> = {
    'Food & Beverage': '#fa8c16',
    'Retail & Commerce': '#52c41a',
    'E-commerce': '#1890ff',
    'Technology': '#722ed1',
    'Healthcare': '#eb2f96',
    'Education': '#13c2c2',
    'Professional Services': '#2f54eb',
    'Manufacturing': '#fa541c',
    'Hospitality': '#faad14',
    'Beauty & Wellness': '#f759ab',
    'Automotive': '#595959',
    'Financial Services': '#237804'
  };
  
  return colorMap[industry] || '#8c8c8c';
}

/**
 * Get progress bar color based on percentage
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 40) return '#52c41a'; // Green for high
  if (percentage >= 20) return '#faad14'; // Orange for medium
  return '#1890ff'; // Blue for low
}

/**
 * Get simulated growth indicator
 */
function getGrowthIndicator(industry: string, count: number): string | undefined {
  // Simulate growth for top industries
  if (count >= 3) {
    const growthOptions = ['+12%', '+8%', '+15%', '+5%'];
    const index = industry.length % growthOptions.length;
    return growthOptions[index];
  }
  return undefined;
}

/**
 * Get top industry name
 */
function getTopIndustry(industryData: IndustryData[]): string {
  if (industryData.length === 0) return 'N/A';
  return industryData[0].industry;
}

/**
 * Get top industry market share
 */
function getTopMarketShare(industryData: IndustryData[]): number {
  if (industryData.length === 0) return 0;
  return industryData[0].percentage;
}

/**
 * Calculate diversity score
 */
function getDiversityScore(industryData: IndustryData[]): string {
  if (industryData.length === 0) return 'N/A';
  
  // Simple diversity calculation
  const totalIndustries = industryData.length;
  const topThreeShare = industryData
    .slice(0, 3)
    .reduce((sum, item) => sum + item.percentage, 0);
  
  if (topThreeShare < 60) return 'High';
  if (topThreeShare < 80) return 'Medium';
  return 'Low';
}