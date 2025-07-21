import { Lead, DashboardData, HubSpotContact } from './types';
import { parse, format } from 'date-fns';

/**
 * Process CSV data into dashboard format
 * Converts raw CSV data to structured Lead objects and calculates metrics
 */
export function processCSVData(leads: Lead[]): DashboardData {
  const lastUpdated = new Date().toISOString();
  const totalCount = leads.length;

  // Calculate metrics
  const todaysLeads = calculateTodaysLeads(leads);
  const wonLeads = calculateWonLeads(leads);
  const lostLeads = calculateLostLeads(leads);
  const sourceBreakdown = calculateSourceBreakdown(leads);
  const originalSourceBreakdown = calculateOriginalSourceBreakdown(leads);
  const formBreakdown = calculateFormBreakdown(leads);
  const geoBreakdown = calculateGeoBreakdown(leads);
  const hourlyDistribution = calculateHourlyDistribution(leads);
  const industryBreakdown = calculateIndustryBreakdown(leads);
  const messageBreakdown = calculateMessageBreakdown(leads);
  const leadStatusBreakdown = calculateLeadStatusBreakdown(leads);
  const topProducts = calculateTopProducts(messageBreakdown);
  const completenessRate = calculateCompletenessRate(leads);

  return {
    leads,
    lastUpdated,
    totalCount,
    todaysLeads,
    wonLeads,
    lostLeads,
    sourceBreakdown,
    originalSourceBreakdown,
    formBreakdown,
    geoBreakdown,
    hourlyDistribution,
    industryBreakdown,
    messageBreakdown,
    leadStatusBreakdown,
    topProducts,
    completenessRate
  };
}

/**
 * Merge baseline data with fresh API data
 * Combines baseline CSV data with new leads from HubSpot API
 */
export function mergeApiData(baseline: DashboardData, apiData: Lead[]): DashboardData {
  // Remove duplicates and merge new leads
  const existingIds = new Set(baseline.leads.map(lead => lead.id));
  const newLeads = apiData.filter(lead => !existingIds.has(lead.id));
  
  // Combine all leads (baseline + new API data)
  const allLeads = [...baseline.leads, ...newLeads];
  
  // Sort by creation date (newest first)
  allLeads.sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime());

  // Recalculate all metrics with combined data
  return processCSVData(allLeads);
}

/**
 * Convert HubSpot API response to Lead objects
 * Transforms HubSpot contact format to our Lead interface
 */
export function convertHubSpotContacts(contacts: HubSpotContact[]): Lead[] {
  return contacts.map(contact => {
    const props = contact.properties;
    
    return {
      id: contact.id,
      firstName: props.firstname || '',
      lastName: props.lastname || '',
      email: props.email || '',
      phone: cleanPhoneNumber(props.phone || ''),
      company: props.company || undefined,
      industry: props.your_industry || undefined,
      state: props.state || undefined,
      createDate: convertHubSpotDate(props.createdate),
      trafficSource: mapTrafficSource(props.hs_latest_source || ''),
      trafficSourceDetail: props.hs_latest_source_data_1 || '',
      originalTrafficSource: props.hs_analytics_source || '',
      formType: mapFormType(props.hs_object_source_detail_1 || ''),
      isComplete: !!(props.company && (props.your_industry || props.industry)),
      recordSource: props.hs_object_source_label || 'Forms',
      leadStatus: props.hs_lead_status,
      formSubmissions: parseInt(props.num_conversion_events || '1'),
      message: props.message
    };
  });
}

/**
 * Calculate traffic source breakdown
 * Groups leads by traffic source and counts them
 */
function calculateSourceBreakdown(leads: Lead[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  leads.forEach(lead => {
    const source = normalizeTrafficSource(lead.trafficSource);
    breakdown[source] = (breakdown[source] || 0) + 1;
  });
  
  return breakdown;
}

/**
 * Calculate form type breakdown
 * Groups leads by form type and counts them
 */
function calculateFormBreakdown(leads: Lead[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  leads.forEach(lead => {
    const form = normalizeFormType(lead.formType);
    breakdown[form] = (breakdown[form] || 0) + 1;
  });
  
  return breakdown;
}

/**
 * Calculate geographic breakdown
 * Groups leads by state/region and counts them
 */
function calculateGeoBreakdown(leads: Lead[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  leads.forEach(lead => {
    const location = normalizeLocation(lead.state || 'Unknown');
    breakdown[location] = (breakdown[location] || 0) + 1;
  });
  
  return breakdown;
}

/**
 * Calculate hourly distribution
 * Groups leads by hour of creation and counts them
 */
function calculateHourlyDistribution(leads: Lead[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  // Initialize all hours to 0
  for (let i = 0; i < 24; i++) {
    distribution[i.toString().padStart(2, '0')] = 0;
  }
  
  leads.forEach(lead => {
    try {
      // Handle Malaysian timezone (UTC+8)
      const date = new Date(lead.createDate);
      const malaysianTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      const hour = malaysianTime.getHours().toString().padStart(2, '0');
      distribution[hour] = (distribution[hour] || 0) + 1;
    } catch (error) {
      console.warn('Error parsing date for lead:', lead.id, error);
    }
  });
  
  return distribution;
}

/**
 * Calculate industry breakdown
 * Groups leads by industry and counts them
 */
function calculateIndustryBreakdown(leads: Lead[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  leads.forEach(lead => {
    const industry = normalizeIndustry(lead.industry || 'Unknown');
    breakdown[industry] = (breakdown[industry] || 0) + 1;
  });
  
  return breakdown;
}

/**
 * Calculate profile completeness rate
 * Returns percentage of leads with complete profiles (company + industry)
 */
function calculateCompletenessRate(leads: Lead[]): number {
  if (leads.length === 0) return 0;
  
  const completeProfiles = leads.filter(lead => lead.isComplete).length;
  return Math.round((completeProfiles / leads.length) * 100);
}

/**
 * Normalize traffic source names for consistent grouping
 */
function normalizeTrafficSource(source: string): string {
  const normalized = source.toLowerCase().trim();
  
  if (normalized.includes('facebook') || normalized.includes('paid social')) {
    return 'Facebook';
  }
  if (normalized.includes('direct')) {
    return 'Direct Traffic';
  }
  if (normalized.includes('google') || normalized.includes('paid search')) {
    return 'Google';
  }
  if (normalized.includes('organic')) {
    return 'Organic Search';
  }
  if (normalized.includes('email')) {
    return 'Email';
  }
  
  return 'Other';
}

/**
 * Normalize form type names for consistent grouping
 */
function normalizeFormType(formType: string): string {
  const normalized = formType.toLowerCase().trim();
  
  if (normalized.includes('mobile pos v3')) {
    return 'Mobile POS v3';
  }
  if (normalized.includes('tablet pos v3')) {
    return 'Tablet POS v3';
  }
  if (normalized.includes('tablet pos v4')) {
    return 'Tablet POS v4';
  }
  if (normalized.includes('unbounce')) {
    return 'Unbounce LP';
  }
  
  return 'Other';
}

/**
 * Normalize location names for consistent grouping
 */
function normalizeLocation(location: string): string {
  const normalized = location.toLowerCase().trim();
  
  if (normalized.includes('kuala lumpur') || normalized.includes('kl')) {
    return 'Kuala Lumpur';
  }
  if (normalized.includes('selangor')) {
    return 'Selangor';
  }
  if (normalized.includes('perak')) {
    return 'Perak';
  }
  if (normalized.includes('johor')) {
    return 'Johor';
  }
  if (normalized.includes('penang')) {
    return 'Penang';
  }
  if (normalized === '' || normalized === 'unknown') {
    return 'Unknown';
  }
  
  return location.charAt(0).toUpperCase() + location.slice(1);
}

/**
 * Normalize industry names for consistent grouping
 */
function normalizeIndustry(industry: string): string {
  const normalized = industry.toLowerCase().trim();
  
  if (normalized.includes('f&b') || normalized.includes('food') || normalized.includes('restaurant') || normalized.includes('cafe')) {
    return 'F&B';
  }
  if (normalized.includes('retail') || normalized.includes('shop')) {
    return 'Retail';
  }
  if (normalized.includes('service') || normalized.includes('business')) {
    return 'Services';
  }
  if (normalized === '' || normalized === 'unknown') {
    return 'Unknown';
  }
  
  return industry.charAt(0).toUpperCase() + industry.slice(1);
}

/**
 * Clean and format Malaysian phone numbers
 */
function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle Malaysian numbers
  if (cleaned.startsWith('60') && !cleaned.startsWith('+60')) {
    cleaned = '+' + cleaned;
  }
  if (cleaned.startsWith('0') && cleaned.length > 10) {
    cleaned = '+60' + cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Convert HubSpot date format to ISO string
 */
function convertHubSpotDate(hubspotDate: string): string {
  try {
    // HubSpot dates are typically in ISO format or timestamp
    const date = new Date(hubspotDate);
    return date.toISOString();
  } catch (error) {
    console.warn('Error parsing HubSpot date:', hubspotDate, error);
    return new Date().toISOString();
  }
}

/**
 * Map HubSpot traffic source to our standard format
 */
function mapTrafficSource(hubspotSource: string): string {
  const source = hubspotSource.toLowerCase();
  
  if (source.includes('facebook') || source.includes('social')) {
    return 'Paid Social';
  }
  if (source.includes('google') || source.includes('search')) {
    return 'Paid Search';
  }
  if (source.includes('direct')) {
    return 'Direct Traffic';
  }
  if (source.includes('organic')) {
    return 'Organic Search';
  }
  if (source.includes('email')) {
    return 'Email';
  }
  
  return 'Other';
}

/**
 * Map form details to form type
 */
function mapFormType(formDetail: string): string {
  const detail = formDetail.toLowerCase();
  
  if (detail.includes('mobile pos v3')) {
    return 'Mobile POS v3';
  }
  if (detail.includes('tablet pos v3')) {
    return 'Tablet POS v3';
  }
  if (detail.includes('tablet pos v4')) {
    return 'Tablet POS v4';
  }
  if (detail.includes('unbounce')) {
    return 'Unbounce LP';
  }
  
  return 'Other';
}

/**
 * Calculate number of leads created today
 */
function calculateTodaysLeads(leads: Lead[]): number {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
  
  return leads.filter(lead => {
    try {
      const leadDate = new Date(lead.createDate);
      const leadDateStr = leadDate.toISOString().split('T')[0];
      return leadDateStr === todayStr;
    } catch (error) {
      return false;
    }
  }).length;
}

/**
 * Calculate number of won leads
 */
function calculateWonLeads(leads: Lead[]): number {
  return leads.filter(lead => 
    lead.leadStatus?.toUpperCase() === 'WON'
  ).length;
}

/**
 * Calculate number of lost leads
 */
function calculateLostLeads(leads: Lead[]): number {
  return leads.filter(lead => 
    lead.leadStatus?.toUpperCase() === 'LOST'
  ).length;
}

/**
 * Calculate original traffic source breakdown
 */
function calculateOriginalSourceBreakdown(leads: Lead[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  leads.forEach(lead => {
    const source = normalizeOriginalTrafficSource(lead.originalTrafficSource || '');
    breakdown[source] = (breakdown[source] || 0) + 1;
  });
  
  return breakdown;
}

/**
 * Calculate message/products breakdown
 */
function calculateMessageBreakdown(leads: Lead[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  leads.forEach(lead => {
    const message = normalizeMessage(lead.message || '');
    if (message && message !== 'Unknown') {
      breakdown[message] = (breakdown[message] || 0) + 1;
    }
  });
  
  return breakdown;
}

/**
 * Calculate lead status breakdown
 */
function calculateLeadStatusBreakdown(leads: Lead[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  leads.forEach(lead => {
    const status = normalizeLeadStatus(lead.leadStatus || '');
    breakdown[status] = (breakdown[status] || 0) + 1;
  });
  
  return breakdown;
}

/**
 * Calculate top 5 products from message breakdown
 */
function calculateTopProducts(messageBreakdown: Record<string, number>): Array<{name: string, count: number}> {
  return Object.entries(messageBreakdown)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * Normalize original traffic source names
 */
function normalizeOriginalTrafficSource(source: string): string {
  const normalized = source.toLowerCase().trim();
  
  if (normalized.includes('direct traffic') || normalized.includes('direct')) {
    return 'Direct Traffic';
  }
  if (normalized.includes('paid social') || normalized.includes('facebook')) {
    return 'Paid Social';
  }
  if (normalized.includes('paid search') || normalized.includes('google')) {
    return 'Paid Search';
  }
  if (normalized.includes('other campaigns')) {
    return 'Other Campaigns';
  }
  if (normalized.includes('organic')) {
    return 'Organic Search';
  }
  if (normalized === '' || normalized === 'unknown') {
    return 'Unknown';
  }
  
  return source.charAt(0).toUpperCase() + source.slice(1);
}

/**
 * Normalize message/product names
 */
function normalizeMessage(message: string): string {
  const normalized = message.toLowerCase().trim();
  
  if (normalized.includes('mobile pos')) {
    return 'Mobile POS';
  }
  if (normalized.includes('tablet pos')) {
    return 'Tablet POS';
  }
  if (normalized === '' || normalized === 'unknown') {
    return 'Unknown';
  }
  
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/**
 * Normalize lead status names
 */
function normalizeLeadStatus(status: string): string {
  const normalized = status.toLowerCase().trim();
  
  if (normalized === 'won') return 'Won';
  if (normalized === 'lost') return 'Lost';
  if (normalized === 'new') return 'New';
  if (normalized === 'contacted') return 'Contacted';
  if (normalized === 'qualified') return 'Qualified';
  if (normalized === 'unqualified') return 'Unqualified';
  if (normalized === '' || normalized === 'unknown') return 'Unknown';
  
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get sample dashboard data for development/testing
 */
export function getSampleDashboardData(): DashboardData {
  // Import the initial data JSON file
  const initialData = require('../data/initial_data.json') as Lead[];
  return processCSVData(initialData);
}