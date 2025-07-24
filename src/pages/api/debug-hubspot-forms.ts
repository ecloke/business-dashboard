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

    // Fetch contacts with the specific properties we need
    const contactsResponse = await axios.get<HubSpotApiResponse>(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 100, // Get more contacts for analysis
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
        }
      }
    );

    const contacts = contactsResponse.data.results;

    // Analyze the hs_object_source_detail_1 field
    const formTypeAnalysis: Record<string, number> = {};
    const rawFormTypeValues: string[] = [];
    const contactsWithFormDetails: Array<{
      id: string;
      name: string;
      email: string;
      createDate: string;
      recordSource: string;
      formDetail1: string;
      formDetail2: string;
      formDetail3: string;
    }> = [];

    contacts.forEach(contact => {
      const formDetail1 = contact.properties.hs_object_source_detail_1 || '';
      const formDetail2 = contact.properties.hs_object_source_detail_2 || '';
      const formDetail3 = contact.properties.hs_object_source_detail_3 || '';
      
      // Count form types
      if (formDetail1) {
        formTypeAnalysis[formDetail1] = (formTypeAnalysis[formDetail1] || 0) + 1;
        rawFormTypeValues.push(formDetail1);
      }

      // Store contact details for analysis
      contactsWithFormDetails.push({
        id: contact.id,
        name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
        email: contact.properties.email || '',
        createDate: contact.properties.createdate || '',
        recordSource: contact.properties.hs_object_source_label || '',
        formDetail1,
        formDetail2,
        formDetail3
      });
    });

    // Sort form types by count
    const sortedFormTypes = Object.entries(formTypeAnalysis)
      .sort(([, a], [, b]) => b - a)
      .map(([formType, count]) => ({ formType, count }));

    // Check for the specific missing form types
    const missingFormTypes = ['Mobile POS v2', 'DStore Leads'];
    const foundMissingTypes = missingFormTypes.map(type => ({
      type,
      foundInApi: rawFormTypeValues.some(value => 
        value.toLowerCase().includes(type.toLowerCase())
      ),
      exactMatches: rawFormTypeValues.filter(value => 
        value.toLowerCase().includes(type.toLowerCase())
      )
    }));

    // Sample contacts for each form type we're looking for
    const sampleContacts = missingFormTypes.map(type => ({
      formType: type,
      samples: contactsWithFormDetails
        .filter(contact => 
          contact.formDetail1.toLowerCase().includes(type.toLowerCase()) ||
          contact.formDetail2.toLowerCase().includes(type.toLowerCase()) ||
          contact.formDetail3.toLowerCase().includes(type.toLowerCase())
        )
        .slice(0, 5) // Get first 5 matches
    }));

    return res.status(200).json({
      success: true,
      summary: {
        totalContacts: contacts.length,
        totalUniqueFormTypes: Object.keys(formTypeAnalysis).length,
        contactsWithFormDetails: contactsWithFormDetails.length
      },
      formTypeAnalysis: sortedFormTypes,
      missingFormTypesAnalysis: foundMissingTypes,
      sampleContactsForMissingTypes: sampleContacts,
      allRawFormValues: [...new Set(rawFormTypeValues)].sort(), // Unique values
      sampleContacts: contactsWithFormDetails.slice(0, 10), // First 10 contacts for inspection
      message: 'HubSpot form types analysis completed'
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