import { processCSVData, getSampleDashboardData } from '../dataProcessor';
import { Lead, DashboardData } from '../types';

const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+60123456789',
    company: 'Tech Corp',
    industry: 'Technology',
    state: 'Selangor',
    country: 'Malaysia',
    createDate: '2025-01-20T10:30:00Z',
    trafficSource: 'Paid Social',
    trafficSourceDetail: 'Facebook',
    formType: 'Mobile POS v3',
    isComplete: true,
    recordSource: 'HubSpot'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+60123456790',
    company: '',
    industry: '',
    state: 'Kuala Lumpur',
    country: 'Malaysia',
    createDate: '2025-01-19T14:15:00Z',
    trafficSource: 'Direct Traffic',
    trafficSourceDetail: 'Direct',
    formType: 'Tablet POS v4',
    isComplete: false,
    recordSource: 'HubSpot'
  },
  {
    id: '3',
    firstName: 'Ahmad',
    lastName: 'Rahman',
    email: 'ahmad@example.com',
    phone: '+60123456791',
    company: 'Food Paradise',
    industry: 'Food & Beverage',
    state: 'Selangor',
    country: 'Malaysia',
    createDate: '2025-01-21T09:00:00Z',
    trafficSource: 'Paid Social',
    trafficSourceDetail: 'Facebook',
    formType: 'Mobile POS v3',
    isComplete: true,
    recordSource: 'HubSpot'
  }
];

describe('Data Processor Functions', () => {
  describe('processCSVData', () => {
    it('processes lead data correctly', () => {
      const result = processCSVData(mockLeads);
      
      expect(result).toBeDefined();
      expect(result.totalCount).toBe(3);
      expect(result.leads).toHaveLength(3);
      expect(result.lastUpdated).toBeDefined();
    });

    it('calculates source breakdown correctly', () => {
      const result = processCSVData(mockLeads);
      
      expect(result.sourceBreakdown).toEqual({
        'Facebook': 2,
        'Direct Traffic': 1
      });
    });

    it('calculates form breakdown correctly', () => {
      const result = processCSVData(mockLeads);
      
      expect(result.formBreakdown).toEqual({
        'Mobile POS v3': 2,
        'Tablet POS v4': 1
      });
    });

    it('calculates geographic breakdown correctly', () => {
      const result = processCSVData(mockLeads);
      
      expect(result.geoBreakdown).toEqual({
        'Selangor': 2,
        'Kuala Lumpur': 1
      });
    });

    it('calculates industry breakdown correctly', () => {
      const result = processCSVData(mockLeads);
      
      expect(result.industryBreakdown).toEqual({
        'Technology': 1,
        'Food & Beverage': 1,
        'Not Specified': 1
      });
    });

    it('calculates completeness rate correctly', () => {
      const result = processCSVData(mockLeads);
      
      // 2 out of 3 leads have complete data (company + industry)
      expect(result.completenessRate).toBe(67); // Math.round((2/3) * 100)
    });

    it('calculates hourly distribution correctly', () => {
      const result = processCSVData(mockLeads);
      
      expect(result.hourlyDistribution).toEqual({
        '10': 1, // John at 10:30
        '14': 1, // Jane at 14:15
        '09': 1  // Ahmad at 09:00
      });
    });

    it('handles empty array gracefully', () => {
      const result = processCSVData([]);
      
      expect(result.totalCount).toBe(0);
      expect(result.leads).toHaveLength(0);
      expect(result.completenessRate).toBe(0);
      expect(Object.keys(result.sourceBreakdown)).toHaveLength(0);
    });

    it('handles malformed data gracefully', () => {
      const malformedLeads = [
        {
          id: '1',
          firstName: '',
          lastName: '',
          email: 'test@example.com',
          phone: '',
          createDate: 'invalid-date',
          trafficSource: '',
          trafficSourceDetail: '',
          formType: '',
          isComplete: false
        } as Lead
      ];
      
      expect(() => processCSVData(malformedLeads)).not.toThrow();
      const result = processCSVData(malformedLeads);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('getSampleDashboardData', () => {
    it('returns valid dashboard data structure', () => {
      const result = getSampleDashboardData();
      
      expect(result).toBeDefined();
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.leads).toBeDefined();
      expect(result.sourceBreakdown).toBeDefined();
      expect(result.formBreakdown).toBeDefined();
      expect(result.geoBreakdown).toBeDefined();
      expect(result.hourlyDistribution).toBeDefined();
      expect(result.industryBreakdown).toBeDefined();
      expect(typeof result.completenessRate).toBe('number');
      expect(result.lastUpdated).toBeDefined();
    });

    it('returns data based on initial_data.json', () => {
      const result = getSampleDashboardData();
      
      // Should match the 19 leads from initial data
      expect(result.totalCount).toBe(19);
      expect(result.leads).toHaveLength(19);
    });

    it('has consistent data relationships', () => {
      const result = getSampleDashboardData();
      
      // Total count should match leads array length
      expect(result.totalCount).toBe(result.leads.length);
      
      // Source breakdown total should equal total count
      const sourceTotal = Object.values(result.sourceBreakdown).reduce((a, b) => a + b, 0);
      expect(sourceTotal).toBe(result.totalCount);
      
      // Form breakdown total should equal total count
      const formTotal = Object.values(result.formBreakdown).reduce((a, b) => a + b, 0);
      expect(formTotal).toBe(result.totalCount);
    });
  });

  describe('Edge Cases', () => {
    it('handles leads with missing required fields', () => {
      const incompleteLeads = [
        {
          id: '1',
          email: 'test@example.com',
          createDate: '2025-01-21T10:00:00Z'
        } as Lead
      ];
      
      expect(() => processCSVData(incompleteLeads)).not.toThrow();
    });

    it('handles leads with null/undefined values', () => {
      const nullLeads = [
        {
          id: '1',
          firstName: null,
          lastName: undefined,
          email: 'test@example.com',
          phone: null,
          company: undefined,
          industry: null,
          state: undefined,
          createDate: '2025-01-21T10:00:00Z',
          trafficSource: null,
          formType: undefined,
          isComplete: false
        } as any
      ];
      
      expect(() => processCSVData(nullLeads)).not.toThrow();
    });
  });
});