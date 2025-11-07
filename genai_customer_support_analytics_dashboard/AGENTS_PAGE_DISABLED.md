# Agents Page Disabled

## Overview
The `/agents` page has been completely commented out and is no longer accessible in the application.

## Changes Made

### 1. **App.tsx**
- ✅ Commented out import: `// import AgentOverview from './components/Dashboard/AgentOverview';`
- ✅ Commented out route: `{/* <Route path="/agents" element={<AgentOverview agents={agents} />} /> */}`

### 2. **Sidebar.tsx**
- ✅ Commented out menu item: `// { id: 'agents', label: 'Agents', icon: Users, color: 'text-gray-300' }`
- The "Agents" menu item no longer appears in the sidebar navigation

### 3. **MainLayout.tsx**
- ✅ Commented out path mapping: `// if (pathname === '/agents') return 'agents';`
- ✅ Commented out route mapping: `// agents: '/agents',`

### 4. **RouteWrappers.tsx**
- ✅ Commented out route mappings in all 5 wrapper components:
  - `ListViewerWrapper`
  - `ConversationListWrapper`
  - `TranscriptListWrapper`
  - `AnalysisCoachingPageWrapper`
  - `EnhancedCoachingDashboardWrapper`

## Impact

### ✅ What's Disabled:
- `/agents` route is no longer accessible
- "Agents" menu item removed from sidebar
- All navigation to agents page disabled

### ✅ What Still Works:
- All other pages function normally
- The `agents` data is still fetched by `useAnalyticsData()` but not displayed
- AgentOverview component still exists but is not imported/used

## How to Re-enable

If you want to re-enable the agents page in the future:

1. **Uncomment in App.tsx:**
   ```typescript
   import AgentOverview from './components/Dashboard/AgentOverview';
   // ...
   <Route path="/agents" element={<AgentOverview agents={agents} />} />
   ```

2. **Uncomment in Sidebar.tsx:**
   ```typescript
   { id: 'agents', label: 'Agents', icon: Users, color: 'text-gray-300' },
   ```

3. **Uncomment in MainLayout.tsx:**
   ```typescript
   if (pathname === '/agents') return 'agents';
   // ...
   agents: '/agents',
   ```

4. **Uncomment in RouteWrappers.tsx** (all 5 occurrences):
   ```typescript
   agents: '/agents',
   ```

## Testing

To verify the agents page is disabled:

1. **Check sidebar**: The "Agents" menu item should NOT be visible
2. **Try direct URL**: Navigate to `http://localhost:5173/agents` → should redirect to dashboard
3. **Check other pages**: All other menu items should work normally

## Files Modified

- `src/App.tsx`
- `src/components/Layout/Sidebar.tsx`
- `src/components/Layout/MainLayout.tsx`
- `src/components/Routes/RouteWrappers.tsx`

## Notes

- The AgentOverview component file still exists at `src/components/Dashboard/AgentOverview.tsx` but is not being used
- The `agents` variable is still destructured from `useAnalyticsData()` in App.tsx but is not passed anywhere
- This is a non-breaking change - all other functionality remains intact
