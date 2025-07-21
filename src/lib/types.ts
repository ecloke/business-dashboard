// Core data interfaces for the HubSpot Business Dashboard

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  industry?: string;
  state?: string;
  country?: string;
  createDate: string; // ISO date string
  createdDate?: string; // Alias for createDate
  trafficSource: string;
  trafficSourceDetail: string;
  originalTrafficSource?: string; // Original Traffic Source from CSV
  source?: string; // Alias for trafficSource
  formType: string;
  formName?: string; // Alias for formType
  isComplete: boolean; // true if has company and industry
  recordSource?: string;
  message?: string; // Message/Product field from CSV
  leadStatus?: string; // Lead Status field from CSV
  formSubmissions?: number;
}

export interface DashboardData {
  leads: Lead[];
  lastUpdated: string; // ISO date string
  totalCount: number;
  todaysLeads: number; // Number of leads created today
  wonLeads: number; // Number of leads with status = WON
  lostLeads: number; // Number of leads with status = LOST
  sourceBreakdown: Record<string, number>; // e.g., { "Facebook": 23, "Direct": 3 }
  originalSourceBreakdown: Record<string, number>; // Original Traffic Source breakdown
  formBreakdown: Record<string, number>; // e.g., { "Mobile POS v3": 12, "Tablet POS v4": 9 }
  geoBreakdown: Record<string, number>; // e.g., { "Kuala Lumpur": 4, "Selangor": 6 }
  hourlyDistribution: Record<string, number>; // e.g., { "00": 3, "01": 1, "02": 0 }
  industryBreakdown: Record<string, number>; // e.g., { "F&B": 6, "Retail": 2 }
  messageBreakdown: Record<string, number>; // Products/Message breakdown
  leadStatusBreakdown: Record<string, number>; // Lead Status breakdown
  topProducts: Array<{name: string, count: number}>; // Top 5 products/messages
  completenessRate: number; // percentage of complete profiles
}

export interface CacheData {
  data: DashboardData;
  leads?: Lead[]; // Optional leads array
  lastUpdated: string; // ISO date string
  source?: 'baseline' | 'api' | 'cache';
  cacheExpiry?: string; // ISO date string
}

// Chart data interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderWidth: number;
  }[];
}

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
  }[];
}

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
  }[];
}

// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  lastUpdated?: string;
}

export interface HubSpotContact {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    company?: string;
    your_industry?: string;
    industry?: string; // Fallback
    state?: string;
    createdate: string;
    lastmodifieddate?: string;
    hubspot_owner_id?: string;
    hs_object_source_label?: string;
    hs_object_source_detail_1?: string;
    hs_object_source_detail_2?: string;
    hs_object_source_detail_3?: string;
    hs_latest_source?: string;
    hs_latest_source_timestamp?: string;
    hs_latest_source_data_1?: string;
    hs_latest_source_data_2?: string;
    hs_analytics_source?: string;
    hs_analytics_source_data_1?: string;
    hs_analytics_source_data_2?: string;
    notes_last_updated?: string;
    hs_lead_status?: string;
    num_conversion_events?: string;
    message?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotApiResponse {
  results: HubSpotContact[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

// Component prop interfaces
export interface MetricsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  loading?: boolean;
}

export interface ChartProps {
  data: DashboardData;
  loading?: boolean;
  height?: number;
}

export interface TableProps {
  data: Lead[];
  loading?: boolean;
  pageSize?: number;
}

// Firebase interfaces
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface CacheDocument {
  data: DashboardData;
  lastUpdated: number; // timestamp
  source: string;
  expiresAt: number; // timestamp
}

// Error handling interfaces
export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  retryable?: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Utility types
export type TrafficSource = 'Paid Social' | 'Direct Traffic' | 'Paid Search' | 'Organic Search' | 'Email' | 'Other';
export type FormType = 'Mobile POS v3' | 'Tablet POS v3' | 'Tablet POS v4' | 'Unbounce LP' | 'Other';
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Unqualified';

// Dashboard component interfaces
export interface DashboardProps {
  initialData?: DashboardData;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

export interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  loading: boolean;
  lastUpdated?: string;
}

// State management interfaces
export interface DashboardState {
  data: DashboardData | null;
  loading: LoadingState;
  error: ErrorState;
  lastRefresh: string | null;
}

export interface DashboardActions {
  setData: (data: DashboardData) => void;
  setLoading: (loading: LoadingState) => void;
  setError: (error: ErrorState) => void;
  clearError: () => void;
  refresh: () => Promise<void>;
}