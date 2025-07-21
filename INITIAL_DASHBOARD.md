## FEATURE:

- React/Next.js business dashboard website with Ant Design UI components deployed to Netlify
- Dashboard displays HubSpot CRM lead generation metrics and analytics
- Uses initial_data.csv as baseline dataset for instant loading
- Refresh button pulls latest data from HubSpot API and merges with baseline
- Caching strategy to optimize API calls and improve performance
- Professional dashboard with charts, tables, and key metrics for sales/marketing teams
- Single-tenant solution pre-configured with company HubSpot credentials
- Serverless architecture using Netlify Functions for HubSpot API integration

## EXAMPLES:

- `dashboard.html` - Use this as the design reference for layout, styling, and data visualization patterns. Convert the HTML structure to React components with Ant Design.
- `initial_data.csv` - This is the baseline dataset that should be loaded immediately when users visit the dashboard. Structure the data processing logic around this CSV format.

In the `examples/` folder (if available):
- Look for React component patterns for dashboard layouts
- Chart.js or Ant Design chart integration examples
- API integration patterns for external data sources
- Netlify Functions examples for serverless backend

## DOCUMENTATION:

- Ant Design documentation: https://ant.design/docs/react/introduce
- Ant Design Charts: https://charts.ant.design/en/docs/manual/getting-started
- HubSpot API documentation: https://developers.hubspot.com/docs/api/overview
- HubSpot Contacts API: https://developers.hubspot.com/docs/api/crm/contacts
- Netlify Functions documentation: https://docs.netlify.com/functions/overview/
- Netlify deployment guide: https://docs.netlify.com/site-deploys/create-deploys/
- React/Next.js documentation for component architecture

## OTHER CONSIDERATIONS:

- Store HubSpot private app access token in Netlify environment variables (HUBSPOT_ACCESS_TOKEN)
- Implement shared team caching strategy using Firebase Firestore (free tier) so all team members see the same latest data
- When any team member clicks refresh, the shared cache updates and benefits all users immediately
- Server-side shared cache in Netlify Functions with fallback to localStorage for offline scenarios
- HubSpot API rate limits: 100 requests per 10 seconds - design incremental data fetching accordingly
- Netlify Functions have 10-second timeout - optimize API calls to stay within limits
- CSV data should be converted to JSON and embedded in the app for instant baseline loading
- Refresh functionality should fetch only records modified since the initial_data.csv export date
- Include error handling for API failures with graceful fallback to shared cache, then baseline CSV data
- Team collaboration: All users see consistent data regardless of who triggered the last refresh
- Cache invalidation strategy to ensure data freshness while minimizing API calls
- Responsive design for mobile/tablet viewing by sales teams
- Add loading states and user feedback during data refresh operations
- Consider time zone handling for Malaysian business hours in timestamp displays
- Include data export functionality (CSV download) for team members who need offline access
- Ensure all services remain within free tiers: Netlify (free), Firebase Firestore (free), HubSpot API (free)
- Firebase configuration using environment variables for secure API key management