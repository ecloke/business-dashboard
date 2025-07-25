name: "Marketing ROI Dashboard - Multi-Dashboard System with Google Sheets Integration"
description: |

## Purpose  
Add a new "Marketing ROI" dashboard to the existing business dashboard system that integrates Google Sheets marketing data with existing HubSpot lead data to provide comprehensive marketing performance analytics with manual refresh and date-based filtering.

## Core Principles
1. **Context is King**: Reuse existing dashboard patterns and styling 
2. **Validation Loops**: Build incrementally with testing at each step
3. **Information Dense**: Leverage existing data processing patterns
4. **Progressive Success**: Navigation first, then integration, then features
5. **Global rules**: Follow all rules in CLAUDE.md

---

## Goal
Build a multi-dashboard system where users can switch between "Leads Overview" (existing) and "Marketing ROI" (new) dashboards. The Marketing ROI dashboard displays 6 key marketing metrics (spend, leads, cost per conversion, conversion rate, CTR, clicks) with both total values and channel breakdowns, sourced from Google Sheets API with date range filtering and manual refresh capability.

## Why
- **Business value**: Complete marketing funnel visibility from spend to conversion
- **Integration**: Combines marketing spend data with existing lead conversion tracking
- **Problems solved**: Manual marketing ROI calculations, scattered data sources, lack of channel performance comparison
- **User impact**: Marketing teams can quickly assess campaign performance and optimize spend allocation

## What
Users can navigate between two dashboard views using a menu system. The new Marketing ROI dashboard shows marketing performance metrics in a consistent design, filtered by date ranges, with manual data refresh from Google Sheets API.

### Success Criteria
- [ ] Navigation menu allows seamless switching between "Leads Overview" and "Marketing ROI" dashboards
- [ ] Marketing ROI dashboard displays all 6 metrics with accurate calculations  
- [ ] Channel breakdown shows data for all available marketing channels from Google Sheets
- [ ] Date range filter updates all metrics correctly for selected time periods
- [ ] Manual refresh button fetches fresh data from Google Sheets API
- [ ] UI matches existing dashboard design quality and responsiveness
- [ ] Build and deployment work without errors (Netlify ready)

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: src/components/Dashboard.tsx
  why: Pattern for dashboard layout, data state management, and refresh functionality

- file: src/components/DashboardFilter.tsx  
  why: Filter component patterns, dropdown styling, React Portal usage

- file: src/lib/dataProcessor.ts
  why: Data processing patterns, calculation functions, caching strategies

- file: src/pages/api/hubspot-data.ts
  why: API endpoint patterns, caching with Firebase, error handling

- file: src/lib/firebase.ts
  why: Cache implementation pattern to follow for Google Sheets data

- file: src/lib/types.ts
  why: TypeScript interface patterns for data structures

- url: https://developers.google.com/sheets/api/quickstart/nodejs
  why: Google Sheets API authentication and data fetching methods
  critical: Service account setup and API key configuration

- doc: https://googleapis.dev/nodejs/googleapis/latest/sheets/
  section: spreadsheets.values.get
  critical: Range specification and data format returned by API
```

### Current Codebase tree
```bash
src/
├── components/
│   ├── Dashboard.tsx                 # Main dashboard with HubSpot data
│   ├── DashboardFilter.tsx          # Form type filtering component  
│   ├── LeadGrowthChart.tsx          # Chart components
│   ├── LeadStatusChart.tsx
│   └── TopTrafficSourceChart.tsx
├── lib/
│   ├── dataProcessor.ts             # Data processing and calculations
│   ├── firebase.ts                  # Cache implementation
│   ├── hubspot.ts                   # HubSpot API integration
│   └── types.ts                     # TypeScript definitions
├── pages/
│   ├── api/
│   │   ├── hubspot-data.ts          # HubSpot data API endpoint
│   │   ├── recent-contact.ts        # Recent contact API
│   │   └── refresh-data.ts          # Manual refresh endpoint
│   └── index.tsx                    # Main page component
└── styles/
    └── globals.css                  # Global styles and CSS variables
```

### Desired Codebase tree with new files
```bash
src/
├── components/
│   ├── Dashboard.tsx                 # [MODIFY] Add navigation state
│   ├── DashboardNavigation.tsx       # [CREATE] Dashboard menu switcher
│   ├── MarketingROIDashboard.tsx     # [CREATE] New marketing dashboard
│   ├── DateRangeFilter.tsx           # [CREATE] Date picker component
│   ├── MarketingMetricCard.tsx       # [CREATE] Metric display card
│   └── ChannelBreakdown.tsx          # [CREATE] Channel comparison
├── lib/
│   ├── dataProcessor.ts             # [MODIFY] Add marketing calculations
│   ├── marketingDataProcessor.ts    # [CREATE] Google Sheets processing
│   ├── googleSheets.ts              # [CREATE] Google Sheets API client
│   └── types.ts                     # [MODIFY] Add marketing data types
├── pages/
│   ├── api/
│   │   └── google-sheets-data.ts    # [CREATE] Google Sheets API endpoint
│   └── index.tsx                    # [MODIFY] Add navigation state
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Use React Portal for dropdowns to avoid z-index issues
// See DashboardFilter.tsx line 108-124 for pattern
createPortal(dropdownContent, document.body)

// CRITICAL: CSS variables pattern for consistent theming
// All components use var(--bg-card), var(--text-primary), etc.
// See globals.css for full variable list

// CRITICAL: Firebase cache pattern for API data
// Manual refresh with getFromCache/saveToCache pattern
// See hubspot-data.ts lines 46-62 for implementation

// CRITICAL: Data processing pattern with deduplication
// All lead data must be deduplicated by phone number
// See dataProcessor.ts deduplicateByPhone function

// GOTCHA: Next.js API routes require explicit CORS headers
// Add Access-Control-Allow-Origin headers for client requests
// See hubspot-data.ts lines 26-29

// GOTCHA: Google Sheets API requires service account authentication
// Store credentials in environment variables, not in code
// API has rate limits - implement request throttling
```

## Implementation Blueprint

### Data models and structure
```typescript
// Marketing data from Google Sheets
interface MarketingData {
  date: string;
  channel: string;
  spend: number;
  leads: number;
  clicks: number;
  impressions: number;
}

// Processed marketing metrics
interface MarketingMetrics {
  spend: number;
  leads: number;
  clicks: number;
  impressions: number;
  costPerConversion: number;
  conversionRate: number;
  ctr: number;
}

// Channel breakdown structure
interface ChannelBreakdown {
  [channel: string]: MarketingMetrics;
}

// Complete dashboard data
interface MarketingDashboardData {
  totalMetrics: MarketingMetrics;
  channelBreakdown: ChannelBreakdown;
  dateRange: {
    start: string;
    end: string;
  };
  lastUpdated: string;
}

// Date range filter
interface DateRange {
  start: Date;
  end: Date;
}
```

### List of tasks to be completed in order

```yaml
Task 1 - Dashboard Navigation Foundation:
MODIFY src/pages/index.tsx:
  - ADD state for active dashboard: useState('leads-overview')
  - INJECT navigation component before existing dashboard
  - PRESERVE existing Dashboard.tsx rendering

CREATE src/components/DashboardNavigation.tsx:
  - MIRROR styling patterns from DashboardFilter.tsx
  - USE modern-card class and CSS variables
  - IMPLEMENT tab-style navigation with active states

Task 2 - Marketing Dashboard Structure:
CREATE src/components/MarketingROIDashboard.tsx:
  - MIRROR layout patterns from Dashboard.tsx
  - USE loading states and error handling patterns
  - IMPLEMENT metric cards grid layout
  
CREATE src/components/DateRangeFilter.tsx:
  - FOLLOW DashboardFilter.tsx dropdown patterns
  - USE React Portal for calendar dropdown
  - IMPLEMENT preset date ranges (Last 7 days, 30 days, etc.)

Task 3 - Google Sheets API Integration:
CREATE src/lib/googleSheets.ts:
  - MIRROR hubspot.ts API client patterns
  - USE service account authentication
  - IMPLEMENT error handling and rate limiting

CREATE src/pages/api/google-sheets-data.ts:
  - COPY structure from hubspot-data.ts
  - USE same caching pattern with Firebase
  - ADD date range query parameters

Task 4 - Data Processing for Marketing Metrics:
CREATE src/lib/marketingDataProcessor.ts:
  - FOLLOW dataProcessor.ts function patterns
  - IMPLEMENT metric calculations (cost per conversion, CTR, etc.)
  - ADD date filtering and channel grouping functions

MODIFY src/lib/types.ts:
  - ADD MarketingData, MarketingMetrics interfaces
  - PRESERVE existing type definitions

Task 5 - Marketing Metric Display Components:
CREATE src/components/MarketingMetricCard.tsx:
  - MIRROR metric card patterns from existing dashboard
  - USE consistent styling with modern-card class
  - IMPLEMENT number formatting and trend indicators

CREATE src/components/ChannelBreakdown.tsx:
  - FOLLOW table/breakdown patterns from existing components
  - USE expandable sections or tabs for channels
  - IMPLEMENT comparison views

Task 6 - Integration and Manual Refresh:
MODIFY src/components/MarketingROIDashboard.tsx:
  - CONNECT Google Sheets API endpoint
  - IMPLEMENT manual refresh button (same pattern as existing)
  - ADD date filter integration with data updates

MODIFY src/components/Dashboard.tsx:
  - ENSURE navigation state is preserved
  - MAINTAIN existing functionality unchanged
```

### Per task pseudocode

```typescript
// Task 1 - Navigation Component
function DashboardNavigation({ activeTab, onTabChange }) {
  // PATTERN: Use modern-card styling like DashboardFilter
  return (
    <div className="modern-card mb-6">
      <div className="flex items-center gap-4">
        {/* PATTERN: Tab buttons with active states */}
        <button 
          className={`px-4 py-2 rounded-lg ${activeTab === 'leads' ? 'active-styles' : 'inactive-styles'}`}
          onClick={() => onTabChange('leads-overview')}
        >
          Leads Overview
        </button>
        {/* Similar for Marketing ROI tab */}
      </div>
    </div>
  );
}

// Task 3 - Google Sheets API
async function fetchMarketingData(dateRange?: DateRange): Promise<MarketingData[]> {
  // PATTERN: Follow hubspot.ts authentication pattern
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  
  // GOTCHA: Rate limiting required for Google Sheets API
  await rateLimiter.acquire();
  
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Sheet1!A:F' // Adjust based on actual sheet structure
  });
  
  // PATTERN: Process and validate data like hubspot.ts
  return processRawSheetData(response.data.values);
}

// Task 4 - Marketing Calculations
function calculateMarketingMetrics(data: MarketingData[]): MarketingMetrics {
  // PATTERN: Follow dataProcessor.ts calculation patterns
  const totals = data.reduce((acc, row) => ({
    spend: acc.spend + row.spend,
    leads: acc.leads + row.leads,
    clicks: acc.clicks + row.clicks,
    impressions: acc.impressions + row.impressions
  }), { spend: 0, leads: 0, clicks: 0, impressions: 0 });
  
  return {
    ...totals,
    costPerConversion: totals.spend / totals.leads || 0,
    conversionRate: (totals.leads / totals.clicks) * 100 || 0,
    ctr: (totals.clicks / totals.impressions) * 100 || 0
  };
}
```

### Integration Points
```yaml
ENVIRONMENT:
  - add to: .env.local
  - variables: "GOOGLE_SHEETS_API_KEY, GOOGLE_SHEETS_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY"
  
DEPENDENCIES:
  - add to: package.json
  - packages: "googleapis@latest, date-fns@latest"
  
CACHE:
  - use existing: Firebase cache pattern from lib/firebase.ts
  - key pattern: "marketing-data-{dateRange}"
  
STYLING:
  - use existing: CSS variables from globals.css
  - classes: "modern-card, text-primary, bg-glass"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run build                        # Next.js build check
npm run type-check                   # TypeScript validation if available
# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Component Tests
```typescript
// TEST each component in isolation
// Render DashboardNavigation with mock props
const mockOnTabChange = jest.fn();
render(<DashboardNavigation activeTab="leads-overview" onTabChange={mockOnTabChange} />);

// Click Marketing ROI tab
fireEvent.click(screen.getByText('Marketing ROI'));
expect(mockOnTabChange).toHaveBeenCalledWith('marketing-roi');

// TEST MarketingMetricCard displays correct values
const mockMetrics = { spend: 1000, leads: 50, costPerConversion: 20 };
render(<MarketingMetricCard title="Total Spend" value={mockMetrics.spend} />);
expect(screen.getByText('$1,000')).toBeInTheDocument();
```

```bash
# Run and iterate until passing:
npm test # or jest if configured
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start the development server
npm run dev

# Test Google Sheets API endpoint
curl "http://localhost:3000/api/google-sheets-data?start=2025-01-01&end=2025-01-31"

# Expected: JSON with marketing data structure
# If error: Check server logs and API credentials

# Test navigation in browser
# 1. Visit http://localhost:3000
# 2. Click "Marketing ROI" tab
# 3. Verify dashboard switches and displays marketing metrics
# 4. Test date range filter updates data
# 5. Test manual refresh button
```

## Final validation Checklist
- [ ] Both dashboards render without errors: Test navigation switching
- [ ] All marketing metrics calculate correctly: Verify spend/leads = cost per conversion
- [ ] Date filtering updates data: Select different ranges and confirm data changes
- [ ] Manual refresh fetches new data: Click refresh and verify API call
- [ ] UI matches existing design: Compare styling and layout consistency
- [ ] Build succeeds for deployment: `npm run build` passes
- [ ] Google Sheets API integration works: API returns data in expected format
- [ ] Responsive design works: Test on mobile viewport

---

## Anti-Patterns to Avoid
- ❌ Don't create new styling patterns when CSS variables exist
- ❌ Don't skip caching - use existing Firebase cache pattern
- ❌ Don't hardcode Google Sheets ranges - make them configurable  
- ❌ Don't ignore API rate limits - implement throttling
- ❌ Don't break existing dashboard functionality
- ❌ Don't commit API keys or sensitive data to git
- ❌ Don't skip error handling for API failures