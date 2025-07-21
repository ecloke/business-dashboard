name: "Business Dashboard with HubSpot Integration - React + Netlify + Firebase"
description: |

## Purpose
Create a professional business dashboard deployed to Netlify that displays real-time HubSpot CRM lead generation analytics with team collaboration features and 100% free service stack.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Build a React/Next.js business dashboard with Ant Design UI that displays HubSpot CRM lead analytics, deployed to Netlify with Firebase Firestore for team data sharing and HubSpot API integration via Netlify Functions.

## Why
- **Business value**: Sales/marketing team gets real-time insights into lead generation performance
- **Team collaboration**: Shared data cache means any team member's refresh benefits everyone  
- **Cost efficiency**: 100% free service stack (Netlify + Firebase + HubSpot free tiers)
- **Instant deployment**: Share single Netlify URL with team for immediate access

## What
Professional dashboard displaying:
- Lead volume metrics and trends
- Traffic source performance (Facebook, Google, Direct)
- Form conversion analytics 
- Geographic distribution of leads
- Industry breakdown analysis
- Recent leads table with real-time updates

### Success Criteria
- [ ] Dashboard loads instantly with baseline CSV data
- [ ] Refresh button pulls latest HubSpot data via API
- [ ] Team members see consistent shared data
- [ ] All services remain within free tiers
- [ ] Mobile-responsive design for field sales access
- [ ] Sub-3 second load times on average connection

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://ant.design/docs/react/introduce
  why: Component patterns, theming, responsive grid system
  
- url: https://ant.design/components/overview  
  why: Chart components, Table, Card, Statistic components for metrics
  
- url: https://docs.netlify.com/functions/overview/
  why: Serverless function patterns for HubSpot API calls
  section: Environment variables, CORS handling, rate limiting
  
- url: https://developers.hubspot.com/docs/api/crm/contacts
  why: Contacts API endpoints, pagination, filtering by modified date
  critical: Rate limits (100 req/10sec), authentication with private app tokens
  
- url: https://firebase.google.com/docs/firestore/quickstart
  why: Firestore setup, real-time listeners, security rules
  section: Web SDK v9+ modular imports, offline persistence
  
- url: https://docs.netlify.com/site-deploys/create-deploys/
  why: Deployment from Git, environment variable setup
  
- file: C:\Users\Ethan\Desktop\ai-project\business-dashboard\dashboard.html
  why: Design reference - layout, styling, charts, color scheme to replicate
  
- file: C:\Users\Ethan\Desktop\ai-project\business-dashboard\initial_data.csv  
  why: Baseline dataset structure, field names, data types to process
  
- file: C:\Users\Ethan\Desktop\ai-project\business-dashboard\INITIAL_DASHBOARD.md
  why: Complete feature requirements, constraints, team collaboration needs
```

### Current Codebase tree
```bash
business-dashboard/
├── CLAUDE.md                                    # Project rules and conventions
├── INITIAL_DASHBOARD.md                         # Feature requirements  
├── dashboard.html                               # Design reference
├── initial_data.csv                            # Baseline HubSpot data
├── examples/                                   # Code patterns (empty)
└── PRPs/                                      # Implementation blueprints
    └── templates/
        └── prp_base.md
```

### Desired Codebase tree with files to be added
```bash
business-dashboard/
├── package.json                                # React + dependencies
├── next.config.js                             # Next.js configuration  
├── tailwind.config.js                         # Tailwind + Ant Design setup
├── .env.example                               # Environment template
├── netlify.toml                               # Netlify deployment config
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx                      # Main dashboard layout
│   │   ├── MetricsCards.tsx                   # KPI metric cards
│   │   ├── Charts/
│   │   │   ├── TrafficSourceChart.tsx         # Pie chart component
│   │   │   ├── FormPerformanceChart.tsx       # Bar chart component  
│   │   │   └── HourlyChart.tsx               # Line chart component
│   │   ├── Tables/
│   │   │   ├── RecentLeadsTable.tsx          # Recent leads table
│   │   │   └── IndustryTable.tsx             # Industry breakdown
│   │   └── RefreshButton.tsx                 # Data refresh control
│   ├── lib/
│   │   ├── hubspot.ts                        # HubSpot API client
│   │   ├── firebase.ts                       # Firebase config/client
│   │   ├── dataProcessor.ts                  # CSV/API data processing
│   │   └── types.ts                          # TypeScript interfaces
│   ├── data/
│   │   └── initial_data.json                 # Converted CSV baseline
│   └── pages/
│       ├── _app.tsx                          # Next.js app wrapper
│       ├── index.tsx                         # Dashboard page
│       └── api/
│           ├── hubspot-data.ts               # Get cached data
│           └── refresh-data.ts               # Refresh from HubSpot
└── functions/                                 # Netlify Functions
    ├── hubspot-data.js                       # Serverless data endpoint
    └── refresh-data.js                       # Serverless refresh endpoint
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Ant Design v5 uses CSS-in-JS, requires ConfigProvider
// Example: All components must be wrapped in ConfigProvider for theming

// CRITICAL: Next.js 13+ uses App Router by default - use Pages Router for simpler setup
// Example: Create next.config.js with { experimental: { appDir: false } }

// CRITICAL: HubSpot API requires "Bearer" prefix for private app tokens
// Example: headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` }

// CRITICAL: Firebase v9+ uses modular imports - no default import
// Example: import { initializeApp } from 'firebase/app' NOT import firebase from 'firebase'

// CRITICAL: Netlify Functions need CORS headers for browser requests
// Example: headers: { 'Access-Control-Allow-Origin': '*' }

// GOTCHA: CSV date format is "2025-07-20 14:58" - needs parsing for JavaScript Date
// GOTCHA: Malaysian phone numbers have +60 prefix - handle formatting
// GOTCHA: Some company/industry fields are empty - handle null/undefined gracefully
```

## Implementation Blueprint

### Data models and structure
```typescript
// Core data interfaces for type safety and consistency
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  industry?: string;
  state?: string;
  createDate: string;
  trafficSource: string;
  trafficSourceDetail: string;
  formType: string;
  isComplete: boolean;
}

interface DashboardData {
  leads: Lead[];
  lastUpdated: string;
  totalCount: number;
  sourceBreakdown: Record<string, number>;
  formBreakdown: Record<string, number>;
  geoBreakdown: Record<string, number>;
  hourlyDistribution: Record<string, number>;
}

interface CacheData {
  data: DashboardData;
  lastUpdated: string;
  source: 'baseline' | 'api' | 'cache';
}
```

### List of tasks to be completed in order

```yaml
Task 1: Project Setup & Dependencies
CREATE package.json:
  - INCLUDE: Next.js 13, React 18, Ant Design 5, TypeScript, Tailwind CSS
  - INCLUDE: Firebase v9, axios for API calls
  - INCLUDE: Chart.js with react-chartjs-2 for visualizations
  - DEV DEPENDENCIES: ESLint, Prettier, @types packages

CREATE next.config.js:
  - DISABLE app directory: { experimental: { appDir: false } }
  - ENABLE: typescript, eslint, reactStrictMode

CREATE tailwind.config.js:
  - INTEGRATE: Ant Design tokens and CSS variables
  - CUSTOMIZE: color palette to match dashboard.html design

Task 2: Environment & Configuration  
CREATE .env.example:
  - HUBSPOT_ACCESS_TOKEN=your_private_app_token_here
  - FIREBASE_API_KEY=your_firebase_api_key
  - FIREBASE_PROJECT_ID=your_project_id
  
CREATE netlify.toml:
  - BUILD command: npm run build
  - FUNCTIONS directory: netlify/functions
  - REDIRECT rules for SPA routing

Task 3: Data Processing & Types
CREATE src/lib/types.ts:
  - DEFINE Lead, DashboardData, CacheData interfaces
  - EXPORT all TypeScript types for components

CREATE src/data/initial_data.json:
  - CONVERT initial_data.csv to JSON format  
  - PARSE dates to ISO format
  - CLEAN phone number formatting
  - HANDLE empty company/industry fields

CREATE src/lib/dataProcessor.ts:
  - FUNCTION: processCSVData(csvData) -> DashboardData
  - FUNCTION: mergeApiData(baseline, apiData) -> DashboardData  
  - FUNCTION: calculateMetrics(leads) -> metrics object
  - HANDLE Malaysian timezone conversion

Task 4: Firebase Setup
CREATE src/lib/firebase.ts:
  - INITIALIZE Firebase app with environment variables
  - EXPORT Firestore instance with proper configuration
  - IMPLEMENT: saveToCache(data), getFromCache(), clearCache()
  - ERROR handling for connection issues

Task 5: HubSpot API Integration  
CREATE src/lib/hubspot.ts:
  - IMPLEMENT: fetchLatestContacts(sinceDate) -> Lead[]
  - INCLUDE: Rate limiting, retry logic, error handling
  - PARSE HubSpot API response to Lead interface
  - FILTER: only contacts modified since baseline export date

Task 6: Netlify Functions
CREATE netlify/functions/hubspot-data.js:
  - GET endpoint returning cached dashboard data
  - FALLBACK to Firebase cache if available
  - CORS headers for browser requests
  - Error handling with proper HTTP status codes

CREATE netlify/functions/refresh-data.js:
  - POST endpoint triggering HubSpot API refresh
  - MERGE baseline + fresh API data
  - SAVE to Firebase cache
  - RETURN updated dashboard data

Task 7: Core Components
CREATE src/components/MetricsCards.tsx:
  - MIRROR layout from dashboard.html metrics grid
  - DISPLAY: total leads, top source %, geographic coverage, data completeness
  - USE: Ant Design Statistic and Card components
  - RESPONSIVE grid with proper breakpoints

CREATE src/components/Charts/TrafficSourceChart.tsx:
  - PIE chart using Chart.js with react-chartjs-2
  - REPLICATE colors and styling from dashboard.html  
  - DATA: Facebook, Direct, Google traffic sources
  - RESPONSIVE sizing for mobile

CREATE src/components/Charts/FormPerformanceChart.tsx:
  - BAR chart showing form submission counts
  - DATA: Mobile POS v3, Tablet POS v3/v4, Unbounce LP
  - MATCH styling from reference dashboard

CREATE src/components/Charts/HourlyChart.tsx:
  - LINE chart showing leads by hour distribution
  - SMOOTH curves with area fill
  - HANDLE Malaysian timezone display

Task 8: Data Tables
CREATE src/components/Tables/RecentLeadsTable.tsx:
  - ANT Design Table component
  - COLUMNS: time, name, company, source, form, status
  - STATUS badges for complete/incomplete profiles
  - PAGINATION for large datasets
  - MOBILE responsive with scroll

CREATE src/components/Tables/IndustryTable.tsx:
  - BREAKDOWN by industry with percentages
  - SORTABLE columns
  - HANDLE empty/unknown industries gracefully

Task 9: Main Dashboard Layout
CREATE src/components/Dashboard.tsx:
  - REPLICATE layout structure from dashboard.html
  - ARRANGE: header, metrics, charts, tables
  - RESPONSIVE grid using Ant Design Layout
  - LOADING states during data fetch

CREATE src/components/RefreshButton.tsx:
  - TRIGGER refresh API call
  - LOADING states with spinner
  - SUCCESS/ERROR feedback messages
  - DISABLE during active refresh

Task 10: Pages & App Structure
CREATE src/pages/_app.tsx:
  - WRAP app in Ant Design ConfigProvider
  - GLOBAL styles and theme configuration
  - ERROR boundary for graceful error handling

CREATE src/pages/index.tsx:
  - MAIN dashboard page component
  - DATA fetching on page load
  - STATE management for dashboard data
  - INTEGRATION of all components

Task 11: API Routes (Next.js)
CREATE src/pages/api/hubspot-data.ts:
  - SERVER-SIDE data fetching endpoint
  - RETURN cached data from Firebase
  - FALLBACK to baseline if cache empty
  - PROPER error handling and status codes

CREATE src/pages/api/refresh-data.ts:
  - TRIGGER HubSpot API refresh
  - UPDATE Firebase cache
  - RETURN fresh dashboard data
  - RATE limiting to prevent abuse
```

### Integration Points
```yaml
FIREBASE:
  - collection: "dashboard_cache"
  - document: "current_data" 
  - fields: { data: DashboardData, lastUpdated: timestamp }
  
NETLIFY:
  - environment: HUBSPOT_ACCESS_TOKEN, FIREBASE_* variables
  - functions: /api/hubspot-data, /api/refresh-data
  - deploy: automatic from Git push
  
HUBSPOT:
  - endpoint: /crm/v3/objects/contacts
  - params: ?properties=firstname,lastname,email,phone,company,industry,hs_analytics_source
  - filter: lastmodifieddate > baseline_export_date
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# TypeScript compilation and linting
npm run type-check          # TypeScript compilation
npm run lint                # ESLint checking  
npm run format              # Prettier formatting

# Expected: No errors. If errors, READ and fix before proceeding.
```

### Level 2: Unit Tests
```typescript
// CREATE __tests__/dataProcessor.test.ts
describe('Data Processing', () => {
  test('processCSVData converts CSV to dashboard format', () => {
    const csvData = mockCSVData;
    const result = processCSVData(csvData);
    expect(result.totalCount).toBe(27);
    expect(result.sourceBreakdown.Facebook).toBe(23);
  });
  
  test('mergeApiData combines baseline and fresh data', () => {
    const baseline = mockBaselineData;
    const apiData = mockApiData;
    const result = mergeApiData(baseline, apiData);
    expect(result.leads.length).toBeGreaterThan(baseline.leads.length);
  });
});

// CREATE __tests__/components/Dashboard.test.tsx  
test('Dashboard renders metrics cards correctly', () => {
  render(<Dashboard data={mockDashboardData} />);
  expect(screen.getByText('Total Leads')).toBeInTheDocument();
  expect(screen.getByText('27')).toBeInTheDocument();
});
```

```bash
# Run tests and fix until passing
npm test                    # Jest test runner
# If failing: Read error, fix component/logic, re-run
```

### Level 3: Integration Test
```bash
# Build and test locally
npm run build              # Next.js production build
npm run start              # Start production server

# Test API endpoints
curl http://localhost:3000/api/hubspot-data
# Expected: JSON with dashboard data

curl -X POST http://localhost:3000/api/refresh-data  
# Expected: JSON with updated data

# Test dashboard in browser
open http://localhost:3000
# Expected: Dashboard loads with charts and data
```

### Level 4: Netlify Deployment Test
```bash
# Deploy to Netlify (via Git push or CLI)
netlify deploy --prod

# Test production deployment
curl https://your-site.netlify.app/api/hubspot-data
# Expected: Same JSON response as local

# Test refresh functionality
curl -X POST https://your-site.netlify.app/api/refresh-data
# Expected: Data updates successfully
```

## Final Validation Checklist
- [ ] All TypeScript compiles: `npm run type-check`
- [ ] No linting errors: `npm run lint`  
- [ ] All tests pass: `npm test`
- [ ] Local build successful: `npm run build`
- [ ] Dashboard loads with baseline data in <3 seconds
- [ ] Refresh button successfully pulls from HubSpot API
- [ ] Multiple browser tabs show consistent shared data
- [ ] Mobile responsive design works on phone/tablet
- [ ] Error states handle API failures gracefully
- [ ] All free tier limits respected (Firebase, Netlify, HubSpot)

---

## Anti-Patterns to Avoid
- ❌ Don't use class components - use React hooks and functional components
- ❌ Don't bypass TypeScript with 'any' types - define proper interfaces  
- ❌ Don't embed API keys in frontend code - use environment variables only
- ❌ Don't ignore HubSpot rate limits - implement proper throttling
- ❌ Don't skip error boundaries - handle API failures gracefully
- ❌ Don't use default Chart.js styling - match the reference design exactly
- ❌ Don't make unnecessary API calls - leverage caching strategy effectively

## Quality Score: 9/10
High confidence for one-pass implementation due to:
✅ Complete context from working HTML reference
✅ Real data structure from CSV file  
✅ Detailed free-tier service constraints
✅ Step-by-step validation gates
✅ Comprehensive error handling strategy
✅ Clear integration patterns and gotchas