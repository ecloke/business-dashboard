import { MarketingData, MarketingMetrics, ChannelBreakdown, MarketingDashboardData, DateRange } from './types';

/**
 * Calculate marketing metrics from raw data
 */
export function calculateMarketingMetrics(data: MarketingData[], closedDealsData?: MarketingData[]): MarketingMetrics {
  if (!data || data.length === 0) {
    return {
      spend: 0,
      leads: 0,
      clicks: 0,
      impressions: 0,
      costPerConversion: 0,
      conversionRate: 0,
      ctr: 0,
      closedDeals: 0,
      closedDealAmount: 0,
      profit: 0,
      cac: 0
    };
  }

  // Aggregate totals from marketing data
  const totals = data.reduce(
    (acc, row) => ({
      spend: acc.spend + (row.spend || 0),
      leads: acc.leads + (row.leads || 0),
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0)
    }),
    { spend: 0, leads: 0, clicks: 0, impressions: 0 }
  );

  // Calculate closed deals metrics from closed deals data if provided
  let closedDeals = 0;
  let closedDealAmount = 0;
  
  if (closedDealsData && closedDealsData.length > 0) {
    // Each row in closedDealsData represents one closed deal
    closedDeals = closedDealsData.length;
    // Sum up the deal amounts (stored in the spend field for closed deals data)
    // Convert from RM to SGD by dividing by 3.3
    closedDealAmount = closedDealsData.reduce((sum, deal) => sum + ((deal.spend || 0) / 3.3), 0);
  }

  // Calculate derived metrics
  const costPerConversion = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const conversionRate = totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0;
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  
  // Calculate profit and CAC
  const profit = closedDealAmount - totals.spend;
  const cac = closedDeals > 0 ? totals.spend / closedDeals : 0;

  return {
    ...totals,
    costPerConversion,
    conversionRate,
    ctr,
    closedDeals,
    closedDealAmount,
    profit,
    cac
  };
}

/**
 * Group marketing data by channel and calculate metrics for each
 */
export function groupByChannel(data: MarketingData[], closedDealsData?: MarketingData[]): ChannelBreakdown {
  if (!data || data.length === 0) {
    return {};
  }

  // Group marketing data by channel
  const channelGroups: { [key: string]: MarketingData[] } = {};
  
  data.forEach(row => {
    const channel = normalizeChannelName(row.channel);
    if (!channelGroups[channel]) {
      channelGroups[channel] = [];
    }
    channelGroups[channel].push(row);
  });

  // Group closed deals data by channel if provided
  const closedDealsGroups: { [key: string]: MarketingData[] } = {};
  
  if (closedDealsData && closedDealsData.length > 0) {
    closedDealsData.forEach(row => {
      // Apply channel attribution logic for closed deals
      let channel: string;
      
      // Check if the deal contains "unbounce" (case insensitive)
      const hasUnbounce = (row.channel || '').toLowerCase().includes('unbounce');
      
      if (hasUnbounce) {
        channel = 'Google Ads'; // Google SEM
      } else {
        channel = 'Meta (Facebook)'; // Meta for everything else
      }
      
      if (!closedDealsGroups[channel]) {
        closedDealsGroups[channel] = [];
      }
      closedDealsGroups[channel].push(row);
    });
  }

  // Calculate metrics for each channel
  const channelBreakdown: ChannelBreakdown = {};
  
  Object.entries(channelGroups).forEach(([channel, channelData]) => {
    const channelClosedDeals = closedDealsGroups[channel] || [];
    channelBreakdown[channel] = calculateMarketingMetrics(channelData, channelClosedDeals);
  });

  return channelBreakdown;
}

/**
 * Normalize channel names for consistent grouping
 */
function normalizeChannelName(channel: string): string {
  if (!channel) return 'Unknown';
  
  const normalized = channel.toLowerCase().trim();
  
  // Facebook/Meta variations
  if (normalized.includes('facebook') || normalized.includes('meta') || normalized.includes('fb')) {
    return 'Meta (Facebook)';
  }
  
  // Google variations
  if (normalized.includes('google ads') || normalized.includes('google adwords') || normalized.includes('adwords')) {
    return 'Google Ads';
  }
  if (normalized.includes('google') && (normalized.includes('search') || normalized.includes('sem'))) {
    return 'Google Ads';
  }
  
  // Instagram
  if (normalized.includes('instagram') || normalized.includes('ig')) {
    return 'Instagram';
  }
  
  // LinkedIn
  if (normalized.includes('linkedin')) {
    return 'LinkedIn';
  }
  
  // TikTok
  if (normalized.includes('tiktok') || normalized.includes('tik tok')) {
    return 'TikTok';
  }
  
  // YouTube
  if (normalized.includes('youtube') || normalized.includes('yt')) {
    return 'YouTube';
  }
  
  // Email
  if (normalized.includes('email') || normalized.includes('newsletter') || normalized.includes('mailchimp')) {
    return 'Email Marketing';
  }
  
  // Organic/SEO
  if (normalized.includes('organic') || normalized.includes('seo') || normalized.includes('search engine')) {
    return 'Organic Search';
  }
  
  // Direct
  if (normalized.includes('direct') || normalized.includes('type-in')) {
    return 'Direct Traffic';
  }
  
  // Referral
  if (normalized.includes('referral') || normalized.includes('partner')) {
    return 'Referral';
  }
  
  // Default: capitalize first letter of each word
  return channel
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Filter marketing data by date range
 */
export function filterDataByDateRange(data: MarketingData[], dateRange?: DateRange): MarketingData[] {
  if (!dateRange || !data) return data;

  const startDate = dateRange.start.toISOString().split('T')[0];
  const endDate = dateRange.end.toISOString().split('T')[0];

  return data.filter(row => {
    if (!row.date) return false;
    return row.date >= startDate && row.date <= endDate;
  });
}

/**
 * Validate marketing data
 */
export function validateMarketingData(data: MarketingData[]): { valid: MarketingData[]; errors: string[] } {
  const valid: MarketingData[] = [];
  const errors: string[] = [];

  if (!data || !Array.isArray(data)) {
    errors.push('Data is not a valid array');
    return { valid, errors };
  }

  data.forEach((row, index) => {
    const rowErrors: string[] = [];

    // Check required fields
    if (!row.date) {
      rowErrors.push(`Row ${index + 1}: Missing date`);
    } else {
      // Validate date format
      const dateObj = new Date(row.date);
      if (isNaN(dateObj.getTime())) {
        rowErrors.push(`Row ${index + 1}: Invalid date format: ${row.date}`);
      }
    }

    if (!row.channel) {
      rowErrors.push(`Row ${index + 1}: Missing channel`);
    }

    // Check numeric fields
    if (typeof row.spend !== 'number' || row.spend < 0) {
      rowErrors.push(`Row ${index + 1}: Invalid spend value: ${row.spend}`);
    }

    if (typeof row.leads !== 'number' || row.leads < 0) {
      rowErrors.push(`Row ${index + 1}: Invalid leads value: ${row.leads}`);
    }

    if (typeof row.clicks !== 'number' || row.clicks < 0) {
      rowErrors.push(`Row ${index + 1}: Invalid clicks value: ${row.clicks}`);
    }

    if (typeof row.impressions !== 'number' || row.impressions < 0) {
      rowErrors.push(`Row ${index + 1}: Invalid impressions value: ${row.impressions}`);
    }

    // Check logical constraints
    if (row.clicks > row.impressions && row.impressions > 0) {
      rowErrors.push(`Row ${index + 1}: Clicks (${row.clicks}) cannot exceed impressions (${row.impressions})`);
    }

    if (row.leads > row.clicks && row.clicks > 0) {
      rowErrors.push(`Row ${index + 1}: Leads (${row.leads}) cannot exceed clicks (${row.clicks})`);
    }

    if (rowErrors.length === 0) {
      valid.push(row);
    } else {
      errors.push(...rowErrors);
    }
  });

  return { valid, errors };
}

/**
 * Get date range summary
 */
function getDateRangeSummary(data: MarketingData[]): { start: string; end: string } {
  if (!data || data.length === 0) {
    const now = new Date();
    return {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: now.toISOString()
    };
  }

  const dates = data
    .map(row => row.date)
    .filter(date => date)
    .sort();

  return {
    start: dates[0] ? new Date(dates[0]).toISOString() : new Date().toISOString(),
    end: dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toISOString() : new Date().toISOString()
  };
}

/**
 * Main processing function: convert raw marketing data into dashboard format
 */
export function processMarketingData(rawData: MarketingData[], dateRange?: DateRange): MarketingDashboardData {
  try {
    console.log(`[Marketing Processor] Processing ${rawData?.length || 0} raw marketing records`);

    // Validate the input data
    const { valid: validData, errors } = validateMarketingData(rawData || []);
    
    if (errors.length > 0) {
      console.warn('[Marketing Processor] Data validation warnings:', errors.slice(0, 5)); // Log first 5 errors
      if (errors.length > 5) {
        console.warn(`[Marketing Processor] ... and ${errors.length - 5} more validation warnings`);
      }
    }

    console.log(`[Marketing Processor] ${validData.length} valid records after validation`);

    // Filter by date range if provided
    const filteredData = dateRange ? filterDataByDateRange(validData, dateRange) : validData;
    console.log(`[Marketing Processor] ${filteredData.length} records after date filtering`);

    // Separate marketing data from closed deals data
    // Marketing data: has clicks/impressions (from Meta/Google sheets)
    // Closed deals data: has leads=1 and no clicks/impressions (from Closed Deals sheet)
    const marketingData = filteredData.filter(row => row.clicks > 0 || row.impressions > 0);
    const closedDealsData = filteredData.filter(row => row.leads === 1 && row.clicks === 0 && row.impressions === 0);
    
    console.log(`[Marketing Processor] Separated into ${marketingData.length} marketing records and ${closedDealsData.length} closed deals`);

    // Calculate total metrics
    const totalMetrics = calculateMarketingMetrics(marketingData, closedDealsData);
    console.log('[Marketing Processor] Calculated total metrics:', {
      spend: totalMetrics.spend,
      leads: totalMetrics.leads,
      closedDeals: totalMetrics.closedDeals,
      profit: totalMetrics.profit,
      costPerConversion: totalMetrics.costPerConversion.toFixed(2)
    });

    // Calculate channel breakdown
    const channelBreakdown = groupByChannel(marketingData, closedDealsData);
    const channelCount = Object.keys(channelBreakdown).length;
    console.log(`[Marketing Processor] Created breakdown for ${channelCount} channels:`, Object.keys(channelBreakdown));

    // Get actual date range from data
    const actualDateRange = getDateRangeSummary(filteredData);

    const result: MarketingDashboardData = {
      totalMetrics,
      channelBreakdown,
      dateRange: actualDateRange,
      lastUpdated: new Date().toISOString()
    };

    console.log('[Marketing Processor] Successfully processed marketing data');
    return result;

  } catch (error) {
    console.error('[Marketing Processor] Error processing marketing data:', error);
    
    // Return empty structure on error
    return {
      totalMetrics: {
        spend: 0,
        leads: 0,
        clicks: 0,
        impressions: 0,
        costPerConversion: 0,
        conversionRate: 0,
        ctr: 0,
        closedDeals: 0,
        closedDealAmount: 0,
        profit: 0,
        cac: 0
      },
      channelBreakdown: {},
      dateRange: {
        start: dateRange?.start.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: dateRange?.end.toISOString() || new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };
  }
}