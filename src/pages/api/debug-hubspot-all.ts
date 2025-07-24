import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface HubSpotContact {
  id: string;
  properties: {
    [key: string]: string;
  };
}

interface HubSpotApiResponse {
  results: HubSpotContact[];
  total: number;
  paging?: {
    next?: {
      after: string;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ 
        success: false,
        message: 'HUBSPOT_ACCESS_TOKEN environment variable is not set' 
      });
    }

    // Fetch ALL contacts using pagination
    const allContacts: HubSpotContact[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 50; // Safety limit

    console.log('Starting to fetch all HubSpot contacts...');

    while (hasMore && pageCount < maxPages) {
      const params: any = {
        limit: 100,
        properties: [
          'firstname',
          'lastname',
          'email',
          'createdate',
          'hs_object_source_label',
          'hs_object_source_detail_1',
          'hs_object_source_detail_2',
          'hs_object_source_detail_3'
        ].join(','),
        archived: false
      };

      if (after) {
        params.after = after;
      }

      const contactsResponse = await axios.get<HubSpotApiResponse>(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params
        }
      );

      const contacts = contactsResponse.data.results;
      allContacts.push(...contacts);
      
      console.log(`Fetched page ${pageCount + 1}: ${contacts.length} contacts (total so far: ${allContacts.length})`);

      // Check if there are more pages
      if (contactsResponse.data.paging?.next?.after) {
        after = contactsResponse.data.paging.next.after;
        pageCount++;
      } else {
        hasMore = false;
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Finished fetching. Total contacts: ${allContacts.length}`);

    // Analyze the hs_object_source_detail_1 field
    const formTypeAnalysis: Record<string, number> = {};
    const rawFormTypeValues: string[] = [];
    const csvComparison: Record<string, { api: number; csv: number }> = {};

    // From your CSV analysis, these are the form types and counts
    const csvFormTypes = {
      "Mobile POS": 194,
      "Unbounce LP (All In One POS) for Google SEM - June 2025 ": 115,
      "Mobile POS v2": 102,
      "DStore Leads for Hubspot Import.csv": 82,
      "Mobile POS v3": 79,
      "Tablet POS v4": 63,
      "Unbounce LP (All In One POS) - June 2025": 30,
      "Tablet POS": 29,
      "Tablet POS v3": 28,
      "Tablet POS v2": 16,
      "XHS Leads for Hubspot Import (Jul 12).csv": 11,
      "Client Profile & Onboarding Form": 6,
      "Organic Meta Leads for Hubspot Import (Jul 14).csv": 2,
      "Organic Leads for Hubspot Import (Jul 15).csv": 2,
      "Unbounce LP (SoftPOS) - June 2025": 1,
      "Send Whatsapp Message": 1,
      "Google Sheets Connector /Excel": 1,
      "Forms": 1
    };

    allContacts.forEach(contact => {
      const formDetail1 = contact.properties.hs_object_source_detail_1 || '';
      
      // Count form types from API
      if (formDetail1) {
        formTypeAnalysis[formDetail1] = (formTypeAnalysis[formDetail1] || 0) + 1;
        rawFormTypeValues.push(formDetail1);
      }
    });

    // Compare API vs CSV
    Object.keys(csvFormTypes).forEach(csvType => {
      const apiCount = formTypeAnalysis[csvType] || 0;
      const csvCount = csvFormTypes[csvType];
      csvComparison[csvType] = { api: apiCount, csv: csvCount };
    });

    // Add API-only types
    Object.keys(formTypeAnalysis).forEach(apiType => {
      if (!csvComparison[apiType]) {
        csvComparison[apiType] = { api: formTypeAnalysis[apiType], csv: 0 };
      }
    });

    // Sort form types by count
    const sortedFormTypes = Object.entries(formTypeAnalysis)
      .sort(([, a], [, b]) => b - a)
      .map(([formType, count]) => ({ formType, count }));

    // Check for the specific missing form types
    const missingFormTypes = ['Mobile POS v2', 'DStore Leads'];
    const foundMissingTypes = missingFormTypes.map(type => {
      const exactMatch = rawFormTypeValues.find(value => value === type);
      const partialMatches = rawFormTypeValues.filter(value => 
        value.toLowerCase().includes(type.toLowerCase())
      );
      const csvMatches = rawFormTypeValues.filter(value => 
        value.includes('DStore Leads') || value.includes('Mobile POS v2')
      );
      
      return {
        type,
        exactMatch: !!exactMatch,
        partialMatches,
        csvStyleMatches: csvMatches,
        foundInApi: partialMatches.length > 0 || csvMatches.length > 0
      };
    });

    // Get sample contacts for missing types (looking for CSV-style entries)
    const csvStyleSamples = allContacts
      .filter(contact => {
        const formDetail1 = contact.properties.hs_object_source_detail_1 || '';
        return formDetail1.includes('.csv') || 
               formDetail1.includes('Import') ||
               formDetail1.includes('Mobile POS v2') ||
               formDetail1.includes('DStore');
      })
      .slice(0, 10)
      .map(contact => ({
        id: contact.id,
        name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
        email: contact.properties.email || '',
        createDate: contact.properties.createdate || '',
        recordSource: contact.properties.hs_object_source_label || '',
        formDetail1: contact.properties.hs_object_source_detail_1 || '',
        formDetail2: contact.properties.hs_object_source_detail_2 || '',
        formDetail3: contact.properties.hs_object_source_detail_3 || ''
      }));

    return res.status(200).json({
      success: true,
      summary: {
        totalContactsFetched: allContacts.length,
        totalPages: pageCount + 1,
        totalUniqueFormTypes: Object.keys(formTypeAnalysis).length,
        csvFormTypesCount: Object.keys(csvFormTypes).length
      },
      apiFormTypeAnalysis: sortedFormTypes,
      csvVsApiComparison: Object.entries(csvComparison)
        .sort(([, a], [, b]) => (b.csv + b.api) - (a.csv + a.api))
        .map(([formType, counts]) => ({
          formType,
          apiCount: counts.api,
          csvCount: counts.csv,
          difference: counts.csv - counts.api,
          status: counts.api === 0 && counts.csv > 0 ? 'MISSING_FROM_API' :
                  counts.api > 0 && counts.csv === 0 ? 'API_ONLY' :
                  counts.api !== counts.csv ? 'COUNT_MISMATCH' : 'MATCH'
        })),
      missingFormTypesAnalysis: foundMissingTypes,
      csvStyleFormEntries: csvStyleSamples,
      uniqueApiFormTypes: [...new Set(rawFormTypeValues)].sort(),
      investigationNotes: {
        totalCsvLeads: Object.values(csvFormTypes).reduce((sum, count) => sum + count, 0),
        totalApiLeads: allContacts.length,
        potentialIssues: [
          allContacts.length !== Object.values(csvFormTypes).reduce((sum, count) => sum + count, 0) ? 'Total count mismatch between API and CSV' : null,
          !rawFormTypeValues.includes('Mobile POS v2') ? 'Mobile POS v2 not found in API' : null,
          !rawFormTypeValues.some(v => v.includes('DStore')) ? 'DStore Leads not found in API' : null
        ].filter(Boolean)
      }
    });

  } catch (error: any) {
    console.error('HubSpot debug API failed:', error);
    
    let errorMessage = 'Unknown error';
    let statusCode = 500;
    
    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status || 500;
      errorMessage = error.response?.data?.message || error.message;
      
      if (statusCode === 401) {
        errorMessage = 'Invalid or expired HubSpot access token';
      } else if (statusCode === 403) {
        errorMessage = 'Insufficient permissions for HubSpot API';
      }
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || error.message
    });
  }
}