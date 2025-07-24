import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface SheetAnalysis {
  sheetName: string;
  headers: string[];
  sampleData: any[][];
  totalRows: number;
}

interface ApiResponse {
  success: boolean;
  data?: SheetAnalysis[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    console.log('[Sheet Analysis] Starting analysis of sheets 7, 8, 9...');

    // Create authenticated Google Sheets client
    const credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Google Sheets credentials not configured');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    // Get spreadsheet metadata to find sheet names
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties'
    });

    const sheetProperties = metadataResponse.data.sheets || [];
    console.log('[Sheet Analysis] Available sheets:', sheetProperties.map(s => ({
      id: s.properties?.sheetId,
      title: s.properties?.title
    })));

    // Analyze each target sheet
    const targetSheets = [7, 8, 9]; // Sheet indices (0-based would be 6, 7, 8)
    const analysisResults: SheetAnalysis[] = [];

    for (const sheetIndex of targetSheets) {
      try {
        const sheetProps = sheetProperties[sheetIndex - 1]; // Convert to 0-based
        const sheetName = sheetProps?.properties?.title || `Sheet${sheetIndex}`;
        
        console.log(`[Sheet Analysis] Analyzing ${sheetName} (index ${sheetIndex})...`);

        // Fetch data from the sheet (first 20 rows to analyze structure)
        const dataResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!1:20`,
          valueRenderOption: 'UNFORMATTED_VALUE',
          dateTimeRenderOption: 'FORMATTED_STRING'
        });

        const values = dataResponse.data.values || [];
        
        if (values.length === 0) {
          console.warn(`[Sheet Analysis] No data found in ${sheetName}`);
          continue;
        }

        // Headers are in row 2 (index 1)
        const headers = values[1] || [];
        const sampleData = values.slice(2, 10); // Rows 3-10 as sample data
        
        analysisResults.push({
          sheetName,
          headers,
          sampleData,
          totalRows: values.length
        });

        console.log(`[Sheet Analysis] ${sheetName} - Headers:`, headers);
        console.log(`[Sheet Analysis] ${sheetName} - Sample rows:`, sampleData.length);

      } catch (sheetError) {
        console.error(`[Sheet Analysis] Error analyzing sheet ${sheetIndex}:`, sheetError);
        analysisResults.push({
          sheetName: `Sheet${sheetIndex}`,
          headers: [],
          sampleData: [],
          totalRows: 0
        });
      }
    }

    console.log('[Sheet Analysis] Analysis complete');

    res.status(200).json({
      success: true,
      data: analysisResults
    });

  } catch (error) {
    console.error('[Sheet Analysis] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}