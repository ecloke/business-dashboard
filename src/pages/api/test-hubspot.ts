import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface HubSpotProperty {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  description?: string;
}

interface HubSpotPropertiesResponse {
  results: HubSpotProperty[];
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

    // First test basic connection
    console.log('Testing HubSpot connection...');
    const testResponse = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 1,
        properties: 'email'
      }
    });

    console.log('Basic connection successful, fetching properties...');

    // Fetch all contact properties
    const propertiesResponse = await axios.get<HubSpotPropertiesResponse>(
      'https://api.hubapi.com/crm/v3/properties/contacts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const properties = propertiesResponse.data.results;

    // CSV columns from your file
    const csvColumns = [
      'Record ID',
      'First Name', 
      'Last Name',
      'Email',
      'Phone Number',
      'Contact owner',
      'Create Date',
      'Record source',
      'Record source detail 1',
      'Record source detail 2', 
      'Record source detail 3',
      'Latest Traffic Source',
      'Latest Traffic Source Date',
      'Latest Traffic Source Drill-Down 1',
      'Latest Traffic Source Drill-Down 2',
      'Original Traffic Source',
      'Original Traffic Source Drill-Down 1',
      'Original Traffic Source Drill-Down 2',
      'Last Activity Date',
      'Lead Status',
      'Number of Form Submissions',
      'Message',
      'State/Region',
      'Your Industry',
      'Company Name'
    ];

    // Current properties we're trying to fetch
    const currentProperties = [
      'firstname',
      'lastname', 
      'email',
      'phone',
      'company',
      'industry',
      'state',
      'createdate',
      'lastmodifieddate',
      'hs_analytics_source',
      'hs_analytics_source_data_1',
      'hs_analytics_source_data_2',
      'lifecyclestage',
      'lead_status',
      'num_form_submissions',
      'message'
    ];

    // Find matching properties
    const availableProperties = properties.map(p => ({
      name: p.name,
      label: p.label,
      type: p.type,
      fieldType: p.fieldType,
      description: p.description
    }));

    // Check which of our current properties exist
    const propertyMatches = currentProperties.map(prop => {
      const found = properties.find(p => p.name === prop);
      return {
        property: prop,
        exists: !!found,
        hubspotInfo: found ? {
          label: found.label,
          type: found.type,
          fieldType: found.fieldType
        } : null
      };
    });

    // Look for properties that might match CSV columns
    const potentialMatches = csvColumns.map(csvCol => {
      // Try to find HubSpot properties that might match this CSV column
      const possibleMatches = properties.filter(prop => {
        const propName = prop.name.toLowerCase();
        const propLabel = prop.label.toLowerCase();
        const csvName = csvCol.toLowerCase();
        
        return propName.includes(csvName.replace(/\s+/g, '_')) ||
               propLabel.includes(csvName) ||
               csvName.includes(propName) ||
               csvName.includes(propLabel.replace(/\s+/g, '_'));
      });

      return {
        csvColumn: csvCol,
        potentialMatches: possibleMatches.map(p => ({
          name: p.name,
          label: p.label,
          type: p.type
        }))
      };
    });

    return res.status(200).json({
      success: true,
      connectionTest: {
        success: true,
        contactsCount: testResponse.data.total || 0,
        message: 'HubSpot connection successful'
      },
      totalProperties: properties.length,
      currentPropertyStatus: propertyMatches,
      csvColumnMatches: potentialMatches,
      allProperties: availableProperties.slice(0, 50), // Limit to first 50 for readability
      message: 'HubSpot API test completed successfully'
    });

  } catch (error: any) {
    console.error('HubSpot API test failed:', error);
    
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