import type { NextApiRequest, NextApiResponse } from 'next';
import { getFromCache, saveToCache } from '../../lib/firebase';
import { fetchMarketingData } from '../../lib/googleSheets';
import { processMarketingData } from '../../lib/marketingDataProcessor';
import { MarketingDashboardData, DateRange, CacheData } from '../../lib/types';

interface ApiResponse {
  success: boolean;
  data?: MarketingDashboardData;
  lastUpdated?: string;
  message?: string;
  source?: 'cache' | 'api' | 'fallback';
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const method = req.method;
  const forceRefresh = method === 'POST' || req.query.force === 'true';

  try {
    // Set CORS headers for client requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (method !== 'GET' && method !== 'POST') {
      res.status(405).json({
        success: false,
        message: 'Method not allowed. Use GET for cached data or POST to force refresh.'
      });
      return;
    }

    // Parse date range parameters
    const startDate = req.query.start as string;
    const endDate = req.query.end as string;
    
    let dateRange: DateRange | undefined;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // Use UTC methods to avoid timezone issues
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
        dateRange = { start, end };
      }
    }

    console.log(`[API] Marketing data request - Method: ${method}, Force: ${forceRefresh}, DateRange: ${startDate} to ${endDate}`);

    // Create cache key based on date range
    const cacheKey = dateRange 
      ? `marketing-data-${startDate}-${endDate}`
      : `marketing-data-default`;

    // Step 1: Skip caching for marketing data (different structure than HubSpot cache)
    // TODO: Implement custom cache for marketing data if needed

    // Step 2: Fetch fresh data from Google Sheets API
    console.log('[API] Fetching data from Google Sheets API...');
    
    let marketingData: MarketingDashboardData;
    
    try {
      // Fetch raw data from Google Sheets
      const rawMarketingData = await fetchMarketingData(dateRange);
      console.log(`[API] Successfully fetched ${rawMarketingData.length} marketing records from Google Sheets`);

      // Process the raw data into dashboard format
      marketingData = processMarketingData(rawMarketingData, dateRange);
      console.log('[API] Successfully processed marketing data for dashboard');

    } catch (apiError) {
      console.error('[API] Google Sheets API failed:', apiError);
      
      // Return error with fallback sample data for development
      const fallbackData: MarketingDashboardData = {
        totalMetrics: {
          spend: 15420.50,
          leads: 187,
          clicks: 2453,
          impressions: 28967,
          costPerConversion: 82.46,
          conversionRate: 7.62,
          ctr: 8.47,
          closedDeals: 8,
          closedDealAmount: 25000.00,
          profit: 9579.50,
          cac: 1927.56
        },
        channelBreakdown: {
          'Meta (Facebook)': {
            spend: 8750.25,
            leads: 112,
            clicks: 1567,
            impressions: 18432,
            costPerConversion: 78.13,
            conversionRate: 7.15,
            ctr: 8.51,
            closedDeals: 5,
            closedDealAmount: 15000.00,
            profit: 6249.75,
            cac: 1750.05
          },
          'Google Ads': {
            spend: 6670.25,
            leads: 75,
            clicks: 886,
            impressions: 10535,
            costPerConversion: 88.94,
            conversionRate: 8.47,
            ctr: 8.41,
            closedDeals: 3,
            closedDealAmount: 10000.00,
            profit: 3329.75,
            cac: 2223.42
          }
        },
        dateRange: {
          start: dateRange?.start.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: dateRange?.end.toISOString() || new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: fallbackData,
        lastUpdated: new Date().toISOString(),
        source: 'fallback',
        message: `Using sample data. Google Sheets error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`
      });
      return;
    }

    // Step 3: Cache the fresh data
    // Note: Skipping cache for now since existing cache is designed for HubSpot data structure
    try {
      console.log('Marketing data processed successfully', { 
        source: 'api', 
        dataCount: Object.keys(marketingData.channelBreakdown).length
      });
    } catch (cacheError) {
      console.warn('[API] Cache operation skipped:', cacheError);
      // Continue with response even if caching fails
    }

    // Step 4: Return the fresh data
    console.log('[API] Returning fresh marketing data');
    res.status(200).json({
      success: true,
      data: marketingData,
      lastUpdated: marketingData.lastUpdated,
      source: 'api'
    });

  } catch (error) {
    console.error('[API] Marketing data request failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      message: 'Failed to fetch marketing data'
    });
  }
}