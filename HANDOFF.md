# THP Dashboards - Project Handoff Document

## Project Overview

THP Dashboards is a web application that generates customizable dashboards from Salesforce reports. Users can connect their Salesforce org, sync reports, and create interactive visualizations with resizable/draggable widgets.

**Live Site**: Deployed on Netlify (auto-deploys from GitHub)
**Repository**: https://github.com/sciensito/thp-dashboards

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Grid Layout | react-grid-layout (resizable/draggable widgets) |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, RLS) |
| Deployment | Netlify (auto-deploy via GitHub webhook) |

---

## Supabase Project

- **Project Reference**: `furqmrqwanxdntmvfexp`
- **Region**: US East 1
- **URL**: `https://furqmrqwanxdntmvfexp.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/furqmrqwanxdntmvfexp

---

## Project Structure

```
thp dashboards/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── charts/
│   │   │   ├── BarChart.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── KPICard.tsx
│   │   └── layout/
│   │       └── AppLayout.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── DashboardsPage.tsx        # Main dashboard list with 3-dot menu
│   │   ├── DashboardViewPage.tsx     # Dashboard view with resizable widgets
│   │   ├── NewDashboardPage.tsx      # Dashboard creation wizard
│   │   ├── ReportsPage.tsx           # Salesforce reports browser
│   │   └── SalesforceSettingsPage.tsx # SF connection settings
│   ├── lib/
│   │   └── supabase.ts               # Supabase client & DB helpers
│   ├── types/
│   │   └── database.ts               # TypeScript types
│   └── App.tsx                       # Router setup
├── supabase/
│   ├── functions/
│   │   ├── salesforce-oauth-callback/  # OAuth callback handler
│   │   ├── salesforce-sync-reports/    # Syncs reports list from SF
│   │   ├── salesforce-fetch-report/    # Fetches actual report data
│   │   └── salesforce-test/            # Tests SF connection
│   └── migrations/                     # Database migrations
├── .env                                # Environment variables (local)
├── netlify.toml                        # Netlify config
└── package.json
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `sf_connections` | Salesforce OAuth tokens (access_token, refresh_token, instance_url) |
| `sf_reports` | Cached list of Salesforce reports metadata |
| `dashboards` | User-created dashboards |
| `widgets` | Widgets on dashboards (linked to SF reports, stores position) |
| `report_snapshots` | Cached report data snapshots (JSONB) |
| `comments` | Collaboration comments (future feature) |

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only access their own data via `auth.uid()`
- `sf_reports` and `report_snapshots` have read policies for all authenticated users

---

## Edge Functions

All deployed with `--no-verify-jwt` for public access (auth handled internally).

### salesforce-oauth-callback
- **Purpose**: Handles OAuth callback from Salesforce
- **Flow**: Exchanges auth code for tokens, stores in `sf_connections`
- **Triggered by**: Salesforce OAuth redirect

### salesforce-sync-reports
- **Purpose**: Fetches list of all reports from Salesforce Analytics API
- **Endpoint**: POST `{ user_id: string }`
- **Stores**: Report metadata in `sf_reports` table
- **Fetches up to**: 100 reports per sync

### salesforce-fetch-report
- **Purpose**: Fetches actual data from a specific Salesforce report
- **Endpoint**: POST `{ report_id: string }`
- **Supports**: Tabular, Summary, and Matrix report formats
- **Parses**: Fact maps, groupings, and column info
- **Caches**: Data in `report_snapshots` table

### salesforce-test
- **Purpose**: Tests if Salesforce connection is valid
- **Returns**: Connection status and org info

---

## Environment Variables

### Supabase Edge Functions (set via Supabase Dashboard)
```
SALESFORCE_CLIENT_ID=<connected-app-client-id>
SALESFORCE_CLIENT_SECRET=<connected-app-client-secret>
SALESFORCE_REDIRECT_URI=https://furqmrqwanxdntmvfexp.supabase.co/functions/v1/salesforce-oauth-callback
```

### Frontend (.env)
```
VITE_SUPABASE_URL=https://furqmrqwanxdntmvfexp.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

## Current Features

### 1. Salesforce OAuth Integration
- Connect/disconnect Salesforce org via OAuth 2.0
- Token storage in `sf_connections` table
- Token refresh handling

### 2. Report Syncing
- Sync all reports from Salesforce Analytics API
- Reports cached in `sf_reports` table
- Displays report name, folder, and last run date

### 3. Dashboard Management
- Create new dashboards with name/description
- Edit and delete dashboards
- 3-dot dropdown menu on dashboard cards

### 4. Widget System
- Add widgets linked to Salesforce reports
- **Resizable**: Drag corners/edges to resize widgets
- **Draggable**: Drag header bar to reposition
- **Save Layout**: Button to persist positions to database
- **Minimum size**: 2x2 grid units

### 5. Chart Type Selector
Each widget has a toolbar to switch between:
- Bar Chart
- Line Chart
- Pie Chart
- Data Table
- KPI (total value)

### 6. Data Refresh
- Manual refresh button fetches fresh data from Salesforce
- Data cached in `report_snapshots` for faster loading

---

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginForm | Login/Signup |
| `/` | DashboardsPage | Dashboard list |
| `/dashboards/new` | NewDashboardPage | Create dashboard wizard |
| `/dashboards/:id` | DashboardViewPage | View/edit dashboard |
| `/reports` | ReportsPage | Browse SF reports |
| `/salesforce` | SalesforceSettingsPage | SF connection settings |

---

## Deployment

### Netlify (Frontend)
- **Auto-deploy**: Triggers on push to `main` branch via GitHub webhook
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Config**: `netlify.toml`

### Supabase Edge Functions
```bash
# Deploy a function
supabase functions deploy <function-name> --no-verify-jwt

# View logs
supabase functions logs <function-name> --project-ref furqmrqwanxdntmvfexp

# Push database migrations
supabase db push
```

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run tsc

# Deploy edge function
supabase functions deploy salesforce-fetch-report --no-verify-jwt

# Link to Supabase project
supabase link --project-ref furqmrqwanxdntmvfexp
```

---

## Salesforce Connected App Setup

1. **Create Connected App** in Salesforce Setup > App Manager
2. **Enable OAuth Settings** with scopes:
   - `api`
   - `refresh_token`
   - `offline_access`
3. **Callback URL**: `https://furqmrqwanxdntmvfexp.supabase.co/functions/v1/salesforce-oauth-callback`
4. **Add secrets** to Supabase Edge Functions settings

---

## Known Issues / Future Work

### Known Issues
1. **Widget type not persisted**: Chart type selection stored in local state only
2. **No auto-save**: Layout changes require manual "Save Layout" click
3. **Report parsing**: Some complex report formats may not parse correctly

### Future Enhancements
- [ ] Persist widget chart type to database
- [ ] Auto-save layout on change (debounced)
- [ ] n8n Cloud integration for scheduled data sync
- [ ] AI-powered visualization suggestions (Claude API)
- [ ] Dashboard sharing and public links
- [ ] Comments/collaboration features
- [ ] Date range filters for reports
- [ ] Export dashboards to PDF

---

## Key Implementation Details

### Widget Resizing (DashboardViewPage.tsx)
Uses `react-grid-layout` with `WidthProvider` HOC:
```typescript
const ReactGridLayout = (GridLayout as any).WidthProvider(GridLayout);

<ReactGridLayout
  layout={layout}
  cols={12}
  rowHeight={80}
  onLayoutChange={handleLayoutChange}
  draggableHandle=".widget-drag-handle"
  isResizable={true}
  isDraggable={true}
/>
```

### Report Data Fetching
The `salesforce-fetch-report` function handles multiple report formats:
- **Tabular**: Direct row data
- **Summary**: Groups with aggregate rows
- **Matrix**: Pivoted data with fact maps

Data is normalized to `{ name, value }` format for charts.

---

## Contact / Resources

- **GitHub Repo**: https://github.com/sciensito/thp-dashboards
- **Supabase Dashboard**: https://supabase.com/dashboard/project/furqmrqwanxdntmvfexp
- **Salesforce Analytics API Docs**: https://developer.salesforce.com/docs/atlas.en-us.api_analytics.meta/api_analytics/
