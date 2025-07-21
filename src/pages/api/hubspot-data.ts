import type { NextApiRequest, NextApiResponse } from 'next';
import { getFromCache, saveToCache } from '../../lib/firebase';
import { fetchLatestContacts } from '../../lib/hubspot';
import { processCSVData } from '../../lib/dataProcessor';
import { DashboardData, Lead, CacheData } from '../../lib/types';
import initialData from '../../data/initial_data.json';

interface ApiResponse {
  success: boolean;
  data?: DashboardData;
  leads?: Lead[];
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

    console.log(`[API] HubSpot data request - Method: ${method}, Force: ${forceRefresh}`);

    // Step 1: Try to get cached data first (unless force refresh)
    if (!forceRefresh) {
      try {
        const cachedData = await getFromCache();
        if (cachedData && cachedData.data && cachedData.leads) {
          console.log('[API] Returning cached data');
          res.status(200).json({
            success: true,
            data: cachedData.data,
            leads: cachedData.leads,
            lastUpdated: cachedData.lastUpdated,
            source: 'cache'
          });
          return;
        }
      } catch (cacheError) {
        console.warn('[API] Cache read failed, proceeding to API fetch:', cacheError);
      }
    }

    // Step 2: Try to fetch fresh data from HubSpot API
    let hubspotLeads: Lead[] | null = null;
    let apiError: string | null = null;

    try {
      if (process.env.HUBSPOT_ACCESS_TOKEN) {
        console.log('[API] Fetching data from HubSpot API...');
        hubspotLeads = await fetchLatestContacts(); // Fetch all contacts without date filter
        console.log(`[API] Successfully fetched ${hubspotLeads?.length || 0} leads from HubSpot`);
      } else {
        console.warn('[API] HubSpot token not configured, skipping API fetch');
        apiError = 'HubSpot API token not configured';
      }
    } catch (error) {
      console.error('[API] HubSpot API fetch failed:', error);
      apiError = error instanceof Error ? error.message : 'HubSpot API error';
    }

    // Step 3: Process data and save to cache
    if (hubspotLeads && hubspotLeads.length > 0) {
      try {
        const processedData = processCSVData(hubspotLeads);
        const timestamp = new Date().toISOString();

        const cacheData: CacheData = {
          data: processedData,
          leads: hubspotLeads,
          lastUpdated: timestamp
        };

        // Save to cache (fire and forget)
        saveToCache(processedData, 'api').catch(error => {
          console.error('[API] Cache save failed:', error);
        });

        console.log('[API] Returning fresh HubSpot data');
        res.status(200).json({
          success: true,
          data: processedData,
          leads: hubspotLeads,
          lastUpdated: timestamp,
          source: 'api'
        });
        return;
      } catch (processError) {
        console.error('[API] Data processing failed:', processError);
        apiError = 'Data processing error';
      }
    }

    // Step 4: Fallback to initial data
    console.log('[API] Using fallback initial data');
    try {
      const fallbackLeads = initialData as Lead[];
      const fallbackData = processCSVData(fallbackLeads);
      const fallbackTimestamp = new Date().toISOString();

      res.status(200).json({
        success: true,
        data: fallbackData,
        leads: fallbackLeads,
        lastUpdated: fallbackTimestamp,
        source: 'fallback',
        message: apiError ? `API error: ${apiError}. Using sample data.` : 'Using sample data'
      });
    } catch (fallbackError) {
      console.error('[API] Fallback data processing failed:', fallbackError);
      res.status(500).json({
        success: false,
        error: 'All data sources failed',
        message: `API: ${apiError}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
      });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Configuration for Next.js API route
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
}