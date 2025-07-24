import { processCSVData, getSampleDashboardData, deduplicateByPhone } from '../dataProcessor';
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
        'F&B': 1,
        'Unknown': 1
      });
    });

    it('calculates completeness rate correctly', () => {
      const result = processCSVData(mockLeads);
      
      // 2 out of 3 leads have complete data (company + industry)
      expect(result.completenessRate).toBe(67); // Math.round((2/3) * 100)
    });

    it('calculates hourly distribution correctly', () => {
      const result = processCSVData(mockLeads);
      
      // Malaysian timezone (+8) conversions: 10:30Z->18:30, 14:15Z->22:15, 09:00Z->17:00
      expect(result.hourlyDistribution['18']).toBe(1); // John at 18:30 MYT
      expect(result.hourlyDistribution['22']).toBe(1); // Jane at 22:15 MYT  
      expect(result.hourlyDistribution['17']).toBe(1); // Ahmad at 17:00 MYT
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
      
      // Should match the leads from initial data (after deduplication)
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.leads).toHaveLength(result.totalCount);
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

  describe('deduplicateByPhone', () => {
    it('removes duplicates based on phone number', () => {
      const duplicateLeads: Lead[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+60123456789',
          createDate: '2025-01-20T10:30:00Z',
          trafficSource: 'Paid Social',
          formType: 'Mobile POS v3',
          isComplete: true
        },
        {
          id: '2',
          firstName: 'John',
          lastName: 'Doe Updated',
          email: 'john.updated@example.com',
          phone: '+60123456789', // Same phone number
          createDate: '2025-01-21T14:30:00Z', // More recent
          trafficSource: 'Direct Traffic',
          formType: 'Tablet POS v4',
          isComplete: true
        }
      ];

      const result = deduplicateByPhone(duplicateLeads);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2'); // Should keep the more recent one
      expect(result[0].lastName).toBe('Doe Updated');
    });

    it('keeps leads with different phone numbers', () => {
      const uniqueLeads: Lead[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+60123456789',
          createDate: '2025-01-20T10:30:00Z',
          trafficSource: 'Paid Social',
          formType: 'Mobile POS v3',
          isComplete: true
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+60123456790', // Different phone
          createDate: '2025-01-21T14:30:00Z',
          trafficSource: 'Direct Traffic',
          formType: 'Tablet POS v4',
          isComplete: true
        }
      ];

      const result = deduplicateByPhone(uniqueLeads);
      
      expect(result).toHaveLength(2);
    });

    it('handles leads with empty phone numbers using email fallback', () => {
      const leadsWithoutPhone: Lead[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '', // Empty phone
          createDate: '2025-01-20T10:30:00Z',
          trafficSource: 'Paid Social',
          formType: 'Mobile POS v3',
          isComplete: false
        },
        {
          id: '2',
          firstName: 'John',
          lastName: 'Doe Updated',
          email: 'john@example.com', // Same email
          phone: '', // Empty phone
          createDate: '2025-01-21T14:30:00Z',
          trafficSource: 'Direct Traffic',
          formType: 'Tablet POS v4',
          isComplete: false
        }
      ];

      const result = deduplicateByPhone(leadsWithoutPhone);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2'); // Should keep the more recent one
    });

    it('normalizes Malaysian phone numbers before deduplication', () => {
      const leadsWithVariantPhones: Lead[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '0123456789', // Malaysian format without country code
          createDate: '2025-01-20T10:30:00Z',
          trafficSource: 'Paid Social',
          formType: 'Mobile POS v3',
          isComplete: true
        },
        {
          id: '2',
          firstName: 'John',
          lastName: 'Doe Updated',
          email: 'john.updated@example.com',
          phone: '+60123456789', // Same number with country code
          createDate: '2025-01-21T14:30:00Z',
          trafficSource: 'Direct Traffic',
          formType: 'Tablet POS v4',
          isComplete: true
        }
      ];

      const result = deduplicateByPhone(leadsWithVariantPhones);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2'); // Should keep the more recent one
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