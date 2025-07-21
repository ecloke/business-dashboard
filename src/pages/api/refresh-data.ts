import type { NextApiRequest, NextApiResponse } from 'next';
import { clearCache, saveToCache } from '../../lib/firebase';
import { fetchLatestContacts } from '../../lib/hubspot';
import { processCSVData } from '../../lib/dataProcessor';
import { DashboardData, Lead, CacheData } from '../../lib/types';

interface RefreshApiResponse {
  success: boolean;
  data?: DashboardData;
  leads?: Lead[];
  lastUpdated?: string;
  message?: string;
  stats?: {
    hubspotLeads: number;
    processedAt: string;
    cacheCleared: boolean;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefreshApiResponse>
) {
  const startTime = Date.now();

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST to refresh data.'
      });
      return;
    }

    console.log('[REFRESH] Starting forced data refresh...');

    // Step 1: Clear existing cache
    let cacheCleared = false;
    try {
      await clearCache();
      cacheCleared = true;
      console.log('[REFRESH] Cache cleared successfully');
    } catch (cacheError) {
      console.warn('[REFRESH] Cache clear failed:', cacheError);
    }

    // Step 2: Validate HubSpot configuration
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      res.status(400).json({
        success: false,
        error: 'HubSpot configuration missing',
        message: 'HubSpot access token is not configured. Please set HUBSPOT_ACCESS_TOKEN environment variable.'
      });
      return;
    }

    // Step 3: Fetch fresh data from HubSpot
    console.log('[REFRESH] Fetching fresh data from HubSpot API...');
    const hubspotLeads = await fetchLatestContacts();
    
    if (!hubspotLeads || hubspotLeads.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No data found',
        message: 'HubSpot API returned no leads. Check your API configuration and data availability.'
      });
      return;
    }

    console.log(`[REFRESH] Successfully fetched ${hubspotLeads.length} leads from HubSpot`);

    // Step 4: Process the data
    console.log('[REFRESH] Processing lead data...');
    const processedData = processCSVData(hubspotLeads);
    const timestamp = new Date().toISOString();

    // Step 5: Save to cache
    console.log('[REFRESH] Saving processed data to cache...');

    try {
      await saveToCache(processedData, 'api');
      console.log('[REFRESH] Data saved to cache successfully');
    } catch (cacheError) {
      console.error('[REFRESH] Cache save failed:', cacheError);
      // Continue anyway since we have fresh data
    }

    const processingTime = Date.now() - startTime;
    console.log(`[REFRESH] Refresh completed in ${processingTime}ms`);

    // Step 6: Return fresh data
    res.status(200).json({
      success: true,
      data: processedData,
      leads: hubspotLeads,
      lastUpdated: timestamp,
      message: `Successfully refreshed ${hubspotLeads.length} leads from HubSpot`,
      stats: {
        hubspotLeads: hubspotLeads.length,
        processedAt: timestamp,
        cacheCleared
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[REFRESH] Error after ${processingTime}ms:`, error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('rate limit')) {
        res.status(429).json({
          success: false,
          error: 'Rate limited',
          message: 'HubSpot API rate limit exceeded. Please try again later.'
        });
        return;
      }

      if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'HubSpot API authentication failed. Check your access token.'
        });
        return;
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        res.status(503).json({
          success: false,
          error: 'Service unavailable',
          message: 'Unable to connect to HubSpot API. Please try again later.'
        });
        return;
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Refresh failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred during refresh'
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
    externalResolver: true,
  },
}