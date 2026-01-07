# SF Dashboards - Handoff Document

## Project Overview
Building a web app that generates dashboards from Salesforce reports for Sales Managers and Executives.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **Charts**: Recharts
- **Orchestration**: n8n Cloud (for scheduled data sync)
- **AI**: Anthropic Claude (for visualization suggestions)
- **Deployment**: Netlify

## Current Status

### Completed
- [x] React app initialized with Vite + TypeScript
- [x] Tailwind CSS configured
- [x] Project structure created
- [x] Supabase client configured
- [x] Authentication context (AuthContext)
- [x] Login/Signup form
- [x] App layout with sidebar navigation
- [x] Dashboards listing page
- [x] Reports browser page
- [x] Salesforce connection settings page
- [x] Chart components (Bar, Line, Pie, KPI, DataTable)
- [x] GitHub repo: https://github.com/sciensito/thp-dashboards
- [x] Netlify config (netlify.toml)
- [x] `.env` file with Supabase credentials
- [x] Database schema with RLS policies (6 tables)
- [x] Supabase Edge Functions deployed (salesforce-connect, salesforce-test, salesforce-sync-reports)
- [x] Dashboard creation wizard (NewDashboardPage)
- [x] Dashboard view page (DashboardViewPage)
- [x] Auto-generation logic for widget suggestions

### Pending (Phase 2+)
- [ ] Widget drag-and-drop customization
- [ ] n8n Cloud integration for scheduled sync
- [ ] AI-powered visualization suggestions via Claude API
- [ ] Dashboard sharing and collaboration
- [ ] Comments system

## Supabase Project Details

**Project (SF Dashboards)**:
- Project Ref: `furqmrqwanxdntmvfexp`
- URL: `https://furqmrqwanxdntmvfexp.supabase.co`
- Anon Key: In `.env` file

**MCP Config** (in `.mcp.json`):
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=furqmrqwanxdntmvfexp"
    }
  }
}
```

## Database Schema (Created)

Tables with RLS enabled:
- `sf_connection` - Salesforce credentials (encrypted)
- `sf_reports` - Cached report metadata
- `report_snapshots` - Report data snapshots
- `dashboards` - User dashboards
- `widgets` - Dashboard widgets
- `comments` - Collaboration comments

## Edge Functions (Deployed)

1. **salesforce-connect** - Save SF credentials & authenticate with OAuth
2. **salesforce-test** - Test SF connection
3. **salesforce-sync-reports** - Fetch reports from SF via SOQL

## File Structure
```
/Users/giovannidevivo/Desktop/thp dashboards/
├── src/
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   ├── charts/{BarChart,LineChart,PieChart,KPICard,DataTable}.tsx
│   │   └── layout/AppLayout.tsx
│   ├── context/AuthContext.tsx
│   ├── lib/supabase.ts
│   ├── pages/
│   │   ├── DashboardsPage.tsx
│   │   ├── NewDashboardPage.tsx
│   │   ├── DashboardViewPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SalesforceSettingsPage.tsx
│   ├── types/database.ts
│   └── App.tsx
├── .env (Supabase credentials)
├── .mcp.json (MCP config)
├── netlify.toml
└── package.json
```

## Routes

- `/login` - Login/Signup page
- `/` - Dashboards listing
- `/dashboards/new` - Create new dashboard wizard
- `/dashboards/:id` - View dashboard
- `/reports` - Salesforce reports browser
- `/salesforce` - Salesforce connection settings
- `/settings` - Settings (placeholder)

## Running the App

```bash
cd /Users/giovannidevivo/Desktop/thp\ dashboards
npm run dev
# Opens at http://localhost:5173
```

## PRD Location
Full PRD is at: `/Users/giovannidevivo/.claude/plans/nested-bubbling-star.md`

## Next Steps

1. **Connect Salesforce** - Go to Settings > Salesforce to add credentials
2. **Sync Reports** - Go to Reports and click "Sync Reports"
3. **Create Dashboard** - Select reports and auto-generate a dashboard
4. **Test Widgets** - View dashboard with sample data visualizations
