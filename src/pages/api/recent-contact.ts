import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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

    console.log('Fetching most recent contact from HubSpot...');

    // Fetch the most recent contact (sorted by createdate descending)
    const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 5, // Get top 5 most recent
        properties: [
          'firstname',
          'lastname',
          'email',
          'phone',
          'company',
          'your_industry',
          'state',
          'createdate',
          'lastmodifieddate',
          'hs_object_source_label',
          'hs_object_source_detail_1',
          'hs_latest_source',
          'hs_latest_source_data_1',
          'hs_analytics_source',
          'hs_analytics_source_data_1',
          'hs_lead_status',
          'num_conversion_events',
          'message'
        ].join(','),
        sorts: 'createdate', // Sort by creation date
        archived: false
      }
    });

    const contacts = response.data.results;
    
    if (!contacts || contacts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No contacts found',
        contacts: []
      });
    }

    // Format the contacts for display
    const formattedContacts = contacts.map((contact: any) => {
      const props = contact.properties;
      
      return {
        id: contact.id,
        name: `${props.firstname || ''} ${props.lastname || ''}`.trim() || 'Unknown Name',
        email: props.email || 'No email',
        phone: props.phone || 'No phone',
        company: props.company || 'No company',
        industry: props.your_industry || 'No industry',
        state: props.state || 'No state',
        createDate: props.createdate,
        formattedCreateDate: props.createdate ? new Date(props.createdate).toLocaleString('en-MY', {
          timeZone: 'Asia/Kuala_Lumpur',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'No date',
        recordSource: props.hs_object_source_label || 'Unknown source',
        recordSourceDetail: props.hs_object_source_detail_1 || 'No detail',
        latestSource: props.hs_latest_source || 'Unknown',
        originalSource: props.hs_analytics_source || 'Unknown',
        leadStatus: props.hs_lead_status || 'No status',
        message: props.message || 'No message',
        formSubmissions: props.num_conversion_events || '0',
        allProperties: props // Include all properties for debugging
      };
    });

    // Get the most recent contact
    const mostRecentContact = formattedContacts[0];

    return res.status(200).json({
      success: true,
      message: `Found ${contacts.length} recent contacts`,
      mostRecentContact,
      allRecentContacts: formattedContacts,
      totalContacts: response.data.total || 0,
      propertyMapping: {
        'CSV Column': 'HubSpot Property',
        'First Name': 'firstname',
        'Last Name': 'lastname', 
        'Email': 'email',
        'Phone Number': 'phone',
        'Company Name': 'company',
        'Your Industry': 'your_industry',
        'State/Region': 'state',
        'Create Date': 'createdate',
        'Record Source': 'hs_object_source_label',
        'Record source detail 1': 'hs_object_source_detail_1',
        'Latest Traffic Source': 'hs_latest_source',
        'Latest Traffic Source Drill-Down 1': 'hs_latest_source_data_1',
        'Original Traffic Source': 'hs_analytics_source',
        'Original Traffic Source Drill-Down 1': 'hs_analytics_source_data_1',
        'Lead Status': 'hs_lead_status',
        'Number of Form Submissions': 'num_conversion_events',
        'Message': 'message'
      }
    });

  } catch (error: any) {
    console.error('Error fetching recent contact:', error);
    
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