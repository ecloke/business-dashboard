import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetricsCards from '../MetricsCards';
import { DashboardData } from '../../lib/types';

// Mock Ant Design components to avoid styling issues in tests
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockDashboardData: DashboardData = {
  leads: [],
  lastUpdated: '2025-01-21T10:30:00Z',
  totalCount: 19,
  todaysLeads: 5,
  wonLeads: 8,
  lostLeads: 3,
  sourceBreakdown: {
    'Paid Social': 16,
    'Direct Traffic': 2,
    'Paid Search': 1
  },
  originalSourceBreakdown: {
    'Paid Social': 14,
    'Direct Traffic': 3,
    'Paid Search': 2
  },
  formBreakdown: {
    'Mobile POS v3': 12,
    'Tablet POS v4': 5,
    'Unbounce LP': 2
  },
  geoBreakdown: {
    'Selangor': 6,
    'Kuala Lumpur': 4,
    'Perak': 3,
    'Johor': 2,
    'Penang': 2,
    'Kedah': 2
  },
  hourlyDistribution: {
    '09': 3,
    '10': 4,
    '11': 2,
    '14': 5,
    '15': 3,
    '16': 2
  },
  industryBreakdown: {
    'Food & Beverage': 6,
    'Retail': 4,
    'Technology': 3,
    'Healthcare': 2,
    'Other': 4
  },
  messageBreakdown: {
    'Mobile POS': 15,
    'Tablet POS': 4
  },
  leadStatusBreakdown: {
    'Won': 8,
    'Lost': 3,
    'New': 6,
    'Contacted': 2
  },
  topProducts: [
    { name: 'Mobile POS', count: 15 },
    { name: 'Tablet POS', count: 4 }
  ],
  completenessRate: 26
};

describe('MetricsCards Component', () => {
  it('renders without crashing', () => {
    render(<MetricsCards data={mockDashboardData} loading={false} />);
    expect(screen.getByText("Today's Leads")).toBeInTheDocument();
  });

  it('displays correct todays leads count', () => {
    render(<MetricsCards data={mockDashboardData} loading={false} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows top traffic source correctly', () => {
    render(<MetricsCards data={mockDashboardData} loading={false} />);
    expect(screen.getByText('Top Traffic Source')).toBeInTheDocument();
    expect(screen.getByText('74%')).toBeInTheDocument(); // 14/19 ≈ 74%
  });

  it('displays won leads', () => {
    render(<MetricsCards data={mockDashboardData} loading={false} />);
    expect(screen.getByText('Won Leads')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('shows lost leads', () => {
    render(<MetricsCards data={mockDashboardData} loading={false} />);
    expect(screen.getByText('Lost Leads')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    render(<MetricsCards data={null} loading={true} />);
    // Check for skeleton loaders (Ant Design Skeleton components)
    expect(document.querySelectorAll('.ant-skeleton')).toHaveLength(5);
  });

  it('handles null data gracefully', () => {
    render(<MetricsCards data={null} loading={false} />);
    expect(screen.getByText("Today's Leads")).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const emptyData: DashboardData = {
      leads: [],
      lastUpdated: '2025-01-21T10:30:00Z',
      totalCount: 0,
      todaysLeads: 0,
      wonLeads: 0,
      lostLeads: 0,
      sourceBreakdown: {},
      originalSourceBreakdown: {},
      formBreakdown: {},
      geoBreakdown: {},
      hourlyDistribution: {},
      industryBreakdown: {},
      messageBreakdown: {},
      leadStatusBreakdown: {},
      topProducts: [],
      completenessRate: 0
    };

    render(<MetricsCards data={emptyData} loading={false} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('has proper responsive grid classes', () => {
    const { container } = render(<MetricsCards data={mockDashboardData} loading={false} />);
    const rowElement = container.querySelector('.ant-row');
    expect(rowElement).toBeInTheDocument();
  });
});