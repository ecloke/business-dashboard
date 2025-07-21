import React from 'react';
import { Card, Table, Tag, Typography, Skeleton, Avatar, Tooltip } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, GlobalOutlined } from '@ant-design/icons';
import { Lead } from '../../lib/types';

const { Title } = Typography;

interface RecentLeadsTableProps {
  leads: Lead[] | null;
  loading?: boolean;
  pageSize?: number;
}

export default function RecentLeadsTable({ 
  leads, 
  loading = false, 
  pageSize = 10 
}: RecentLeadsTableProps) {
  if (loading) {
    return (
      <Card 
        variant="borderless"
        style={{ 
          height: '100%',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
        }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Recent Leads</Title>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <Card 
        variant="borderless"
        style={{ 
          height: '100%',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
        }}
      >
        <Title level={4} style={{ marginBottom: '16px' }}>Recent Leads</Title>
        <div style={{ 
          textAlign: 'center', 
          color: '#8c8c8c', 
          padding: '48px 0' 
        }}>
          No leads available
        </div>
      </Card>
    );
  }

  // Sort leads by created date (most recent first)
  const sortedLeads = [...leads].sort((a, b) => {
    const dateA = new Date(a.createdDate || a.createDate);
    const dateB = new Date(b.createdDate || b.createDate);
    
    // Handle invalid dates by putting them at the end
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB.getTime() - dateA.getTime();
  });

  const columns = [
    {
      title: 'Date',
      key: 'createDate',
      render: (record: Lead) => (
        <div style={{ fontSize: '12px' }}>
          <div style={{ color: '#262626', fontWeight: '500' }}>
            {formatDate(record.createdDate || record.createDate)}
          </div>
          <div style={{ color: '#8c8c8c' }}>
            {formatTime(record.createdDate || record.createDate)}
          </div>
        </div>
      ),
      width: 100,
      sorter: (a: Lead, b: Lead) => {
        const dateA = new Date(a.createdDate || a.createDate);
        const dateB = new Date(b.createdDate || b.createDate);
        
        // Handle invalid dates by putting them at the end
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateA.getTime() - dateB.getTime();
      },
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: Lead) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
            size={32}
          />
          <div>
            <div style={{ 
              fontWeight: '500', 
              color: '#262626',
              marginBottom: '2px'
            }}>
              {formatContactName(record)}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#8c8c8c',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {record.email && (
                <Tooltip title={record.email}>
                  <MailOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              )}
              {record.phone && (
                <Tooltip title={formatPhone(record.phone)}>
                  <PhoneOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      render: (company: string) => (
        <div style={{ 
          color: company ? '#262626' : '#8c8c8c',
          fontStyle: company ? 'normal' : 'italic'
        }}>
          {company || 'Not specified'}
        </div>
      ),
      width: 150,
    },
    {
      title: 'Location',
      key: 'location',
      render: (record: Lead) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <GlobalOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
          <span style={{ color: '#262626', fontSize: '13px' }}>
            {formatLocation(record)}
          </span>
        </div>
      ),
      width: 120,
    },
    {
      title: 'Source',
      key: 'source',
      render: (record: Lead) => (
        <Tag color={getSourceColor(record.source || record.trafficSource)} style={{ margin: 0 }}>
          {formatSource(record.source || record.trafficSource)}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Form',
      key: 'formName',
      render: (record: Lead) => (
        <span style={{ 
          fontSize: '12px',
          color: '#595959',
          backgroundColor: '#f5f5f5',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          {formatFormName(record.formName || record.formType)}
        </span>
      ),
      width: 120,
    },
  ];

  return (
    <Card 
      bordered={false}
      style={{ 
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <Title level={4} style={{ margin: 0, color: '#262626' }}>
          Recent Leads
        </Title>
        <div style={{ 
          fontSize: '12px', 
          color: '#8c8c8c',
          fontWeight: '500'
        }}>
          {leads.length} total leads
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={sortedLeads}
        rowKey={(record) => record.id || record.email}
        pagination={{
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} leads`,
          pageSizeOptions: ['5', '10', '20', '50'],
        }}
        size="small"
        scroll={{ x: 800 }}
        rowClassName={(record, index) => 
          index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
        }
      />

      {/* Quick stats footer */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px',
        background: '#fafafa',
        borderRadius: '6px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '12px',
        fontSize: '12px'
      }}>
        <div>
          <div style={{ color: '#8c8c8c' }}>This Week</div>
          <div style={{ color: '#262626', fontWeight: '500' }}>
            {getThisWeekCount(leads)}
          </div>
        </div>
        <div>
          <div style={{ color: '#8c8c8c' }}>Complete Profiles</div>
          <div style={{ color: '#262626', fontWeight: '500' }}>
            {getCompleteProfilesCount(leads)}
          </div>
        </div>
        <div>
          <div style={{ color: '#8c8c8c' }}>Top Source</div>
          <div style={{ color: '#262626', fontWeight: '500' }}>
            {getTopSourceName(leads)}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Format contact name with fallback
 */
function formatContactName(lead: Lead): string {
  const firstName = lead.firstName?.trim() || '';
  const lastName = lead.lastName?.trim() || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else if (lead.email) {
    return lead.email.split('@')[0];
  } else {
    return 'Unnamed Contact';
  }
}

/**
 * Format phone number for Malaysian format
 */
function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Malaysian mobile format
  if (digits.startsWith('60')) {
    const localNumber = digits.substring(2);
    if (localNumber.length === 9 || localNumber.length === 10) {
      return `+60 ${localNumber.substring(0, 2)} ${localNumber.substring(2, 5)} ${localNumber.substring(5)}`;
    }
  }
  
  return phone; // Return original if can't format
}

/**
 * Format location from state and country
 */
function formatLocation(lead: Lead): string {
  if (lead.state && lead.country) {
    return `${lead.state}, ${lead.country}`;
  } else if (lead.state) {
    return lead.state;
  } else if (lead.country) {
    return lead.country;
  } else {
    return 'Malaysia';
  }
}

/**
 * Get color for traffic source tag
 */
function getSourceColor(source: string): string {
  const colorMap: Record<string, string> = {
    'Paid Social': 'blue',
    'Facebook': 'blue',
    'Direct Traffic': 'green',
    'Direct': 'green',
    'Paid Search': 'red',
    'Google': 'red',
    'Organic Search': 'cyan',
    'Email': 'orange',
    'Other': 'default'
  };
  
  return colorMap[source] || 'default';
}

/**
 * Format source name for display
 */
function formatSource(source: string): string {
  const formatMap: Record<string, string> = {
    'Paid Social': 'Facebook',
    'Direct Traffic': 'Direct',
    'Paid Search': 'Google',
    'Organic Search': 'Organic'
  };
  
  return formatMap[source] || source;
}

/**
 * Format form name for compact display
 */
function formatFormName(formName: string): string {
  if (!formName) return 'Unknown';
  
  const formatMap: Record<string, string> = {
    'Mobile POS v3': 'Mobile v3',
    'Tablet POS v3': 'Tablet v3', 
    'Tablet POS v4': 'Tablet v4',
    'Unbounce LP': 'Landing Page'
  };
  
  return formatMap[formName] || formName;
}

/**
 * Format date in Malaysian timezone
 */
function formatDate(dateString: string): string {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-MY', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Format time in Malaysian timezone
 */
function formatTime(dateString: string): string {
  if (!dateString) return 'No time';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    
    return date.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Invalid time';
  }
}

/**
 * Count leads from this week
 */
function getThisWeekCount(leads: Lead[]): number {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return leads.filter(lead => 
    new Date(lead.createdDate || lead.createDate) >= oneWeekAgo
  ).length;
}

/**
 * Count leads with complete profiles
 */
function getCompleteProfilesCount(leads: Lead[]): number {
  return leads.filter(lead => 
    lead.firstName && 
    lead.lastName && 
    lead.email && 
    lead.phone && 
    lead.company
  ).length;
}

/**
 * Get the most common traffic source
 */
function getTopSourceName(leads: Lead[]): string {
  const sourceCount: Record<string, number> = {};
  
  leads.forEach(lead => {
    const source = formatSource(lead.source || lead.trafficSource);
    sourceCount[source] = (sourceCount[source] || 0) + 1;
  });
  
  const topEntry = Object.entries(sourceCount)
    .reduce((max, current) => current[1] > max[1] ? current : max, ['N/A', 0]);
    
  return topEntry[0];
}