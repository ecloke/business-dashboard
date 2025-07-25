import { google } from 'googleapis';
import { MarketingData, DateRange } from './types';

/**
 * Rate limiter for Google Sheets API
 */
class RateLimiter {
  private lastRequest = 0;
  private readonly minInterval = 100; // 100ms between requests

  async acquire(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest = Date.now();
  }
}

const rateLimiter = new RateLimiter();

/**
 * Create authenticated Google Sheets client
 */
function createSheetsClient() {
  try {
    const credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Google Sheets credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error creating Google Sheets client:', error);
    throw error;
  }
}

/**
 * Process Meta Ads sheet data
 */
function processMetaSheetData(values: any[][]): MarketingData[] {
  if (!values || values.length < 3) return []; // Need headers in row 2 + data
  
  const headers = values[1]; // Headers in row 2
  const data: MarketingData[] = [];
  
  // Find column indices based on actual headers
  const dateIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('date'));
  const clicksIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('clicks'));
  const impressionsIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('impressions'));
  const spendIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('amount spent'));
  const leadsIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('leads'));
  const ctrIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('ctr'));
  
  console.log('[Meta Sheet] Column mapping:', { dateIdx, clicksIdx, impressionsIdx, spendIdx, leadsIdx, ctrIdx });
  
  // Process data rows (starting from row 3, index 2)
  for (let i = 2; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0) continue;
    
    try {
      const dateStr = row[dateIdx];
      if (!dateStr) continue;
      
      // Parse date
      let date: string;
      if (typeof dateStr === 'string') {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) continue;
        date = parsedDate.toISOString().split('T')[0];
      } else {
        continue;
      }
      
      const marketingRow: MarketingData = {
        date,
        channel: 'Meta (Facebook)',
        spend: spendIdx !== -1 ? parseFloat(row[spendIdx]) || 0 : 0,
        leads: leadsIdx !== -1 ? parseInt(row[leadsIdx]) || 0 : 0,
        clicks: clicksIdx !== -1 ? parseInt(row[clicksIdx]) || 0 : 0,
        impressions: impressionsIdx !== -1 ? parseInt(row[impressionsIdx]) || 0 : 0
      };
      
      data.push(marketingRow);
    } catch (error) {
      console.warn(`Error processing Meta row ${i + 1}:`, error);
      continue;
    }
  }
  
  return data;
}

/**
 * Process Google SEM sheet data
 */
function processGoogleSheetData(values: any[][]): MarketingData[] {
  if (!values || values.length < 3) return []; // Need headers in row 2 + data
  
  const headers = values[1]; // Headers in row 2
  const data: MarketingData[] = [];
  
  // Find column indices based on actual headers
  const dateIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('date') && !h?.toLowerCase().includes('month'));
  const clicksIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('clicks'));
  const impressionsIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('impressions'));
  const spendIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('cost micros'));
  const leadsIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('conversions'));
  const ctrIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('ctr'));
  
  console.log('[Google Sheet] Column mapping:', { dateIdx, clicksIdx, impressionsIdx, spendIdx, leadsIdx, ctrIdx });
  
  // Process data rows (starting from row 3, index 2)
  for (let i = 2; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0) continue;
    
    try {
      const dateStr = row[dateIdx];
      if (!dateStr) continue;
      
      // Parse date
      let date: string;
      if (typeof dateStr === 'string') {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) continue;
        date = parsedDate.toISOString().split('T')[0];
      } else {
        continue;
      }
      
      const marketingRow: MarketingData = {
        date,
        channel: 'Google Ads',
        spend: spendIdx !== -1 ? parseFloat(row[spendIdx]) || 0 : 0,
        leads: leadsIdx !== -1 ? parseInt(row[leadsIdx]) || 0 : 0,
        clicks: clicksIdx !== -1 ? parseInt(row[clicksIdx]) || 0 : 0,
        impressions: impressionsIdx !== -1 ? parseInt(row[impressionsIdx]) || 0 : 0
      };
      
      data.push(marketingRow);
    } catch (error) {
      console.warn(`Error processing Google row ${i + 1}:`, error);
      continue;
    }
  }
  
  return data;
}

/**
 * Process Closed Deals sheet data for additional leads context
 */
function processClosedDealsData(values: any[][]): MarketingData[] {
  if (!values || values.length < 3) return []; // Need headers in row 2 + data
  
  const headers = values[1]; // Headers in row 2
  const data: MarketingData[] = [];
  
  // Find column indices
  const createDateIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('create date'));
  const sourceIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('record source detail'));
  const amountIdx = headers.findIndex((h: string) => h?.toLowerCase().includes('amount'));
  
  console.log('[Closed Deals] Column mapping:', { createDateIdx, sourceIdx, amountIdx });
  
  // Process data rows (starting from row 3, index 2)
  for (let i = 2; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0) continue;
    
    try {
      const dateStr = row[createDateIdx];
      const source = row[sourceIdx];
      if (!dateStr || !source) continue;
      
      // Parse date (only take date part, ignore time)
      let date: string;
      if (typeof dateStr === 'string') {
        const parsedDate = new Date(dateStr.split(' ')[0]); // Take date part only
        if (isNaN(parsedDate.getTime())) continue;
        date = parsedDate.toISOString().split('T')[0];
      } else {
        continue;
      }
      
      // Determine channel from source
      const sourceStr = String(source).toLowerCase();
      let channel: string;
      
      if (sourceStr.includes('unbounce')) {
        // All Unbounce deals should be attributed to Google SEM
        channel = 'Google Ads';
      } else {
        // Everything else (including Mobile POS, etc.) goes to Meta
        channel = 'Meta (Facebook)';
      }
      
      // Get deal amount
      const dealAmount = amountIdx !== -1 ? parseFloat(row[amountIdx]) || 0 : 0;

      const dealRow: MarketingData = {
        date,
        channel,
        spend: dealAmount, // Store deal amount in spend field for processing
        leads: 1, // Each row is 1 closed deal
        clicks: 0, // No click data in closed deals
        impressions: 0 // No impression data in closed deals
      };
      
      data.push(dealRow);
    } catch (error) {
      console.warn(`Error processing Closed Deal row ${i + 1}:`, error);
      continue;
    }
  }
  
  return data;
}

/**
 * Filter data by date range
 */
function filterDataByDateRange(data: MarketingData[], dateRange?: DateRange): MarketingData[] {
  if (!dateRange) return data;

  const startDate = dateRange.start.toISOString().split('T')[0];
  const endDate = dateRange.end.toISOString().split('T')[0];

  return data.filter(row => {
    return row.date >= startDate && row.date <= endDate;
  });
}

/**
 * Fetch marketing data from Google Sheets (multiple sheets)
 */
export async function fetchMarketingData(dateRange?: DateRange): Promise<MarketingData[]> {
  try {
    console.log('[Google Sheets] Fetching marketing data from multiple sheets...');
    
    const sheets = createSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured. Please set GOOGLE_SHEETS_SHEET_ID environment variable.');
    }

    // Get sheet metadata to find the actual sheet names
    await rateLimiter.acquire();
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties'
    });

    const sheetProperties = metadataResponse.data.sheets || [];
    console.log('[Google Sheets] Available sheets:', sheetProperties.map(s => ({ 
      id: s.properties?.sheetId, 
      title: s.properties?.title 
    })));

    // Get the names of sheets 7, 8, and 9 (1-indexed)
    const sheet7Name = sheetProperties[6]?.properties?.title || 'Sheet7'; // Closed Deals List
    const sheet8Name = sheetProperties[7]?.properties?.title || 'Sheet8'; // Meta daily ads performance
    const sheet9Name = sheetProperties[8]?.properties?.title || 'Sheet9'; // Google SEM

    console.log(`[Google Sheets] Target sheets: ${sheet7Name}, ${sheet8Name}, ${sheet9Name}`);

    // Fetch data from all three sheets in parallel
    const allData: MarketingData[] = [];

    // Fetch Meta ads data (Sheet 8)
    try {
      await rateLimiter.acquire();
      console.log(`[Google Sheets] Fetching Meta ads data from ${sheet8Name}...`);
      
      const metaResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet8Name}!A:Z`, // Get all columns
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });

      if (metaResponse.data.values && metaResponse.data.values.length > 2) {
        const metaData = processMetaSheetData(metaResponse.data.values);
        console.log(`[Google Sheets] Processed ${metaData.length} Meta records`);
        allData.push(...metaData);
      }
    } catch (metaError) {
      console.warn(`[Google Sheets] Error fetching Meta data from ${sheet8Name}:`, metaError);
    }

    // Fetch Google Ads data (Sheet 9)
    try {
      await rateLimiter.acquire();
      console.log(`[Google Sheets] Fetching Google Ads data from ${sheet9Name}...`);
      
      const googleResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet9Name}!A:Z`, // Get all columns
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });

      if (googleResponse.data.values && googleResponse.data.values.length > 2) {
        const googleData = processGoogleSheetData(googleResponse.data.values);
        console.log(`[Google Sheets] Processed ${googleData.length} Google Ads records`);
        allData.push(...googleData);
      }
    } catch (googleError) {
      console.warn(`[Google Sheets] Error fetching Google Ads data from ${sheet9Name}:`, googleError);
    }

    // Fetch Closed Deals data (Sheet 7) - for additional context
    try {
      await rateLimiter.acquire();
      console.log(`[Google Sheets] Fetching Closed Deals data from ${sheet7Name}...`);
      
      const dealsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet7Name}!A:Z`, // Get all columns
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });

      if (dealsResponse.data.values && dealsResponse.data.values.length > 2) {
        const dealsData = processClosedDealsData(dealsResponse.data.values);
        console.log(`[Google Sheets] Processed ${dealsData.length} Closed Deal records`);
        // Note: Adding deals data for additional leads context, but main marketing metrics come from sheets 8 & 9
        allData.push(...dealsData);
      }
    } catch (dealsError) {
      console.warn(`[Google Sheets] Error fetching Closed Deals data from ${sheet7Name}:`, dealsError);
    }

    console.log(`[Google Sheets] Total processed ${allData.length} marketing records from all sheets`);

    // Filter by date range if provided
    const filteredData = filterDataByDateRange(allData, dateRange);
    console.log(`[Google Sheets] Filtered to ${filteredData.length} records for date range`);

    return filteredData;

  } catch (error) {
    console.error('[Google Sheets] Error fetching data:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('credentials not configured')) {
        throw new Error('Google Sheets API credentials not configured. Please check environment variables.');
      } else if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Permission denied. Please check Google Sheets sharing settings and service account permissions.');
      } else if (error.message.includes('NOT_FOUND')) {
        throw new Error('Google Sheet not found. Please check the GOOGLE_SHEETS_SHEET_ID environment variable.');
      }
    }
    
    throw error;
  }
}

/**
 * Test Google Sheets connection
 */
export async function testSheetsConnection(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const sheets = createSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
    
    if (!spreadsheetId) {
      return {
        success: false,
        message: 'Google Sheets ID not configured'
      };
    }

    // Try to fetch sheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties'
    });

    return {
      success: true,
      message: 'Connection successful',
      data: {
        title: response.data.properties?.title,
        sheets: response.data.sheets?.map(sheet => sheet.properties?.title)
      }
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}