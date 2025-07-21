import axios, { AxiosInstance, AxiosError } from 'axios';
import { HubSpotContact, HubSpotApiResponse, Lead } from './types';
import { convertHubSpotContacts } from './dataProcessor';

// HubSpot API configuration
const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const CONTACTS_ENDPOINT = '/crm/v3/objects/contacts';
const RATE_LIMIT_PER_SECOND = parseInt(process.env.HUBSPOT_RATE_LIMIT_PER_SECOND || '10');
const MAX_RETRIES = parseInt(process.env.MAX_API_RETRIES || '3');
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT_SECONDS || '30') * 1000;

// Contact properties to fetch from HubSpot (based on your mapping)
const CONTACT_PROPERTIES = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'company',
  'your_industry',
  'state',
  'createdate',
  'lastmodifieddate',
  'hubspot_owner_id',
  'hs_object_source_label',
  'hs_object_source_detail_1',
  'hs_object_source_detail_2', 
  'hs_object_source_detail_3',
  'hs_latest_source',
  'hs_latest_source_timestamp',
  'hs_latest_source_data_1',
  'hs_latest_source_data_2',
  'hs_analytics_source',
  'hs_analytics_source_data_1',
  'hs_analytics_source_data_2',
  'notes_last_updated',
  'hs_lead_status',
  'num_conversion_events',
  'message'
];

// Rate limiting state
let lastRequestTime = 0;
let requestCount = 0;
let resetTime = 0;

/**
 * HubSpot API client class with rate limiting and error handling
 */
class HubSpotClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: HUBSPOT_API_BASE,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        await this.enforceRateLimit();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Update rate limit tracking from response headers
        this.updateRateLimitState(response.headers);
        return response;
      },
      (error) => {
        // Handle rate limit errors specifically
        if (error.response?.status === 429) {
          console.warn('Rate limit exceeded, will retry with backoff');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch latest contacts modified since a specific date
   * Returns converted Lead objects with retry logic
   */
  async fetchLatestContacts(sinceDate?: string): Promise<Lead[]> {
    try {
      const allContacts: HubSpotContact[] = [];
      let after: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await this.fetchContactsPage(after, sinceDate);
        allContacts.push(...response.results);
        
        // Check if there are more pages
        if (response.paging?.next?.after) {
          after = response.paging.next.after;
        } else {
          hasMore = false;
        }

        // Respect rate limits between pages
        await this.waitForRateLimit();
      }

      console.log(`Fetched ${allContacts.length} contacts from HubSpot`);
      
      // Convert HubSpot contacts to our Lead format
      return convertHubSpotContacts(allContacts);
    } catch (error) {
      console.error('Error fetching contacts from HubSpot:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Fetch a single page of contacts with optional filtering
   */
  private async fetchContactsPage(after?: string, sinceDate?: string): Promise<HubSpotApiResponse> {
    const params: any = {
      limit: 100, // Maximum allowed by HubSpot
      properties: CONTACT_PROPERTIES.join(','),
      archived: false
    };

    // Add pagination cursor if provided
    if (after) {
      params.after = after;
    }

    // Add date filter if provided
    if (sinceDate) {
      params.filterGroups = JSON.stringify([{
        filters: [{
          propertyName: 'lastmodifieddate',
          operator: 'GTE',
          value: new Date(sinceDate).getTime().toString()
        }]
      }]);
    }

    const response = await this.executeWithRetry(() =>
      this.client.get(CONTACTS_ENDPOINT, { params })
    );

    return response.data;
  }

  /**
   * Test HubSpot API connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.get(CONTACTS_ENDPOINT, {
        params: {
          limit: 1,
          properties: 'email'
        }
      });

      return {
        success: true,
        message: `Connection successful. Access to ${response.data.results?.length || 0} contacts confirmed.`
      };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      return {
        success: false,
        message: `Connection failed: ${errorMessage}`
      };
    }
  }

  /**
   * Get account information and rate limit status
   */
  async getAccountInfo(): Promise<{
    rateLimitRemaining: number;
    rateLimitTotal: number;
    resetTime: number;
  }> {
    try {
      // Make a lightweight request to get rate limit headers
      const response = await this.client.get('/crm/v3/objects/contacts', {
        params: { limit: 1, properties: 'email' }
      });

      const headers = response.headers;
      return {
        rateLimitRemaining: parseInt(headers['x-hubspot-ratelimit-remaining'] || '0'),
        rateLimitTotal: parseInt(headers['x-hubspot-ratelimit-daily'] || '1000'),
        resetTime: parseInt(headers['x-hubspot-ratelimit-reset'] || '0')
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      return {
        rateLimitRemaining: 0,
        rateLimitTotal: 1000,
        resetTime: Date.now() + 24 * 60 * 60 * 1000
      };
    }
  }

  /**
   * Execute API request with retry logic
   */
  private async executeWithRetry<T>(request: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        const delay = this.getRetryDelay(MAX_RETRIES - retries);
        console.log(`Retrying request in ${delay}ms. Retries remaining: ${retries}`);
        
        await this.sleep(delay);
        return this.executeWithRetry(request, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Enforce rate limiting before making requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter every second
    if (now - resetTime >= 1000) {
      requestCount = 0;
      resetTime = now;
    }

    // If we've hit the rate limit, wait
    if (requestCount >= RATE_LIMIT_PER_SECOND) {
      const waitTime = 1000 - (now - resetTime);
      if (waitTime > 0) {
        await this.sleep(waitTime);
        requestCount = 0;
        resetTime = Date.now();
      }
    }

    requestCount++;
    lastRequestTime = now;
  }

  /**
   * Wait for rate limit to reset if needed
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minInterval = 1000 / RATE_LIMIT_PER_SECOND;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await this.sleep(waitTime);
    }
  }

  /**
   * Update rate limit state from response headers
   */
  private updateRateLimitState(headers: any): void {
    const remaining = headers['x-hubspot-ratelimit-remaining'];
    const resetTimestamp = headers['x-hubspot-ratelimit-reset'];

    if (remaining) {
      // Adjust our local rate limiting based on server response
      const serverRemaining = parseInt(remaining);
      if (serverRemaining < RATE_LIMIT_PER_SECOND) {
        requestCount = RATE_LIMIT_PER_SECOND - serverRemaining;
      }
    }

    if (resetTimestamp) {
      resetTime = parseInt(resetTimestamp);
    }
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      
      // Retry on rate limits, server errors, and timeouts
      return status === 429 || 
             (status && status >= 500) || 
             error.code === 'ECONNABORTED' ||
             error.code === 'ETIMEDOUT';
    }
    
    return false;
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  private getRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    // Add jitter to avoid thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Extract meaningful error message from API error
   */
  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        return error.response.data.message;
      }
      if (error.response?.status === 401) {
        return 'Invalid or expired access token';
      }
      if (error.response?.status === 403) {
        return 'Insufficient permissions for HubSpot API';
      }
      if (error.response?.status === 429) {
        return 'Rate limit exceeded';
      }
      return `HTTP ${error.response?.status}: ${error.message}`;
    }
    
    return error.message || 'Unknown error occurred';
  }

  /**
   * Handle and format API errors for application use
   */
  private handleApiError(error: any): Error {
    const message = this.getErrorMessage(error);
    const wrappedError = new Error(`HubSpot API Error: ${message}`);
    
    // Preserve original error for debugging
    (wrappedError as any).originalError = error;
    
    return wrappedError;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let hubspotClient: HubSpotClient | null = null;

/**
 * Get or create HubSpot client instance
 */
function getHubSpotClient(): HubSpotClient {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is required');
  }

  if (!hubspotClient) {
    hubspotClient = new HubSpotClient(accessToken);
  }

  return hubspotClient;
}

/**
 * Fetch latest contacts from HubSpot
 * High-level function for use in API routes
 */
export async function fetchLatestContacts(sinceDate?: string): Promise<Lead[]> {
  const client = getHubSpotClient();
  return client.fetchLatestContacts(sinceDate);
}

/**
 * Test HubSpot API connection
 * Useful for health checks and setup validation
 */
export async function testHubSpotConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getHubSpotClient();
    return client.testConnection();
  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize HubSpot client: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get HubSpot account information and rate limits
 */
export async function getHubSpotAccountInfo(): Promise<{
  rateLimitRemaining: number;
  rateLimitTotal: number;
  resetTime: number;
}> {
  const client = getHubSpotClient();
  return client.getAccountInfo();
}

// Export the client class for advanced usage
export { HubSpotClient };