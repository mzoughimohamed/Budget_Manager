# Cycle-Based Budget Months — Design Spec

## Goal

Replace calendar-month filtering with a configurable salary-cycle period. The user sets a "cycle start day" (e.g. 21) and all views — overview, planning, transactions, export, calendar — filter data for that rolling window (e.g. Apr 21 – May 20) instead of the calendar month.

## Architecture

**Approach:** Frontend computes date ranges; backend becomes a dumb date-range filter. A new `UserSettings` model stores `cycle_start_day`. A `useCycleSettings` React Query hook fetches the setting once and shares it across all pages.

**Tech stack additions:** No new libraries. Uses existing Django models pattern, existing React Query setup, existing date-fns.

---

## Backend

### New app: `settings` (or add to `budgets`)

**Model: `UserSettings`** (`backend/settings_app/models.py`)

```python
class UserSettings(models.Model):
    cycle_start_day = models.IntegerField(default=1)  # 1–28
```

Single row. Created with defaults on first `GET`. Capped at 28 to avoid Feb 29/30/31 edge cases.

**Serializer:** `UserSettingsSerializer` with field `cycle_start_day` (validated: min=1, max=28).

**View:** `GET /api/settings/` returns the single settings row (creates it if missing). `PATCH /api/settings/` updates `cycle_start_day`.

**URL:** `path('api/settings/', settings_view)` in `budget_app/urls.py`.

---

### Changed endpoints

#### `GET /api/transactions/`

Old param: `?month=YYYY-MM`
New param: `?start=YYYY-MM-DD&end=YYYY-MM-DD`

Filter: `date__gte=start, date__lte=end`. Falls back to returning all transactions if neither param is supplied.

#### `GET /api/summary/`

Old param: `?month=YYYY-MM`
New params: `?start=YYYY-MM-DD&end=YYYY-MM-DD&month=YYYY-MM`

- Expenses filtered by `date__gte=start, date__lte=end`
- Income sources filtered by `month__year=year, month__month=mon` (unchanged — income sources are labeled by cycle identifier month, not by transaction date)
- Returns 400 if `start`, `end`, or `month` are missing.

#### `GET /api/export/csv/` and `GET /api/export/pdf/`

Old param: `?month=YYYY-MM`
New params: `?start=YYYY-MM-DD&end=YYYY-MM-DD`

Filter transactions by `date__gte=start, date__lte=end`. PDF/CSV filename uses `start` date.

#### `GET /api/income-sources/` — **unchanged**

Still uses `?month=YYYY-MM`. Income sources are assigned to a cycle by label (year + month), not by date range.

---

## Frontend

### New: `useCycleSettings` hook (`frontend/src/hooks/useCycleSettings.js`)

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../api/settings'
import { format } from 'date-fns'

export function useCycleSettings() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings().then(r => r.data),
  })

  const cycleStartDay = data?.cycle_start_day ?? 1

  function cycleRange(month) {
    // month = 'YYYY-MM'
    const [year, mon] = month.split('-').map(Number)
    const start = new Date(year, mon - 1, cycleStartDay)
    const endDate = new Date(year, mon, cycleStartDay - 1)
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd'),
      label: `${format(start, 'MMM d')} – ${format(endDate, 'MMM d')}`,
    }
  }

  return { cycleStartDay, cycleRange }
}
```

`cycleRange('2026-04')` with `cycleStartDay=21` returns:
```js
{ start: '2026-04-21', end: '2026-05-20', label: 'Apr 21 – May 20' }
```

When `cycleStartDay=1`, `cycleRange('2026-04')` returns `{ start: '2026-04-01', end: '2026-04-30' }` — identical to current calendar-month behavior.

### New: `frontend/src/api/settings.js`

```js
import client from './client'
export const getSettings = () => client.get('/api/settings/')
export const updateSettings = (data) => client.patch('/api/settings/', data)
```

### Updated: `MonthPicker`

Gains optional `cycleLabel` prop (string, e.g. `"Apr 21 – May 20"`). When provided, renders a second line below the month name in smaller grey text. When `cycleStartDay=1` (default), `cycleLabel` is not passed and the picker looks identical to today.

```jsx
<span className="text-sm font-semibold w-28 text-center">{format(date, 'MMMM yyyy')}</span>
{cycleLabel && (
  <span className="text-xs text-gray-400 text-center">{cycleLabel}</span>
)}
```

### Updated: All pages that use `month` state

`OverviewPage`, `PlanningPage`, `TransactionsPage`, `ExportPage` each:
1. Call `useCycleSettings()` to get `cycleRange`
2. Compute `const { start, end, label } = cycleRange(month)` when month changes
3. Pass `start`/`end` to API calls that need date-range filtering
4. Pass `label` to `MonthPicker` as `cycleLabel`
5. Income sources API calls continue to receive `month` unchanged

### Updated: `MonthCalendar`

Receives `cycleStart` and `cycleEnd` (date strings) in addition to `transactions`.

Grid built as:
```js
const start = startOfWeek(parseISO(cycleStart))
const end = endOfWeek(parseISO(cycleEnd))
const days = eachDayOfInterval({ start, end })
```

Day is "in cycle" if `day >= parseISO(cycleStart) && day <= parseISO(cycleEnd)`.
- In-cycle days: clickable, dot indicator if they have transactions
- Out-of-cycle days: grey, non-clickable (same as current out-of-month days)

`OverviewPage` passes `cycleStart` and `cycleEnd` down to `MonthCalendar`.

### New: `SettingsPage` (`frontend/src/pages/SettingsPage.jsx`)

Route: `/settings`

Single card with:
- Label: "Budget cycle starts on day"
- Number input (1–28), pre-filled with current value
- Helper text: "e.g. 21 means your April cycle runs Apr 21 – May 20"
- Save button — calls `PATCH /api/settings/`, invalidates `['settings']` query on success
- Success/error toast feedback

### Updated: Navigation

`TopNav`: add gear icon linking to `/settings`.
`MobileBottomNav`: add Settings tab (gear icon) alongside existing tabs.
`App.jsx`: add `<Route path="/settings" element={<SettingsPage />} />` inside `ProtectedRoute`.

---

## Edge Cases

**cycle_start_day = 1:** Behaves identically to today — calendar month view, no range subtitle.

**End-of-month days (29, 30, 31):** Cap at 28 to avoid invalid dates in February. Validated on both backend (serializer) and frontend (input max=28).

**Existing data:** No migration needed. All existing transactions and income sources display correctly — they're just filtered by a wider or differently-bounded date range.

**Export filename:** PDF/CSV use `start` date: `budget-2026-04-21.pdf`.

---

## Files Changed

| File | Action |
|---|---|
| `backend/settings_app/models.py` | Create |
| `backend/settings_app/serializers.py` | Create |
| `backend/settings_app/views.py` | Create |
| `backend/settings_app/urls.py` | Create |
| `backend/settings_app/apps.py` | Create |
| `backend/settings_app/migrations/0001_initial.py` | Create |
| `backend/settings_app/migrations/__init__.py` | Create |
| `backend/budget_app/settings.py` | Add `settings_app` to `INSTALLED_APPS` |
| `backend/budget_app/urls.py` | Add `settings/` route |
| `backend/transactions/views.py` | Change `month` param to `start`/`end` in 4 views |
| `frontend/src/api/settings.js` | Create |
| `frontend/src/hooks/useCycleSettings.js` | Create |
| `frontend/src/components/planning/MonthPicker.jsx` | Add `cycleLabel` prop |
| `frontend/src/components/overview/MonthCalendar.jsx` | Use `cycleStart`/`cycleEnd` for grid |
| `frontend/src/pages/OverviewPage.jsx` | Use cycle range |
| `frontend/src/pages/PlanningPage.jsx` | Use cycle range |
| `frontend/src/pages/TransactionsPage.jsx` | Use cycle range |
| `frontend/src/pages/ExportPage.jsx` | Use cycle range |
| `frontend/src/pages/SettingsPage.jsx` | Create |
| `frontend/src/components/layout/TopNav.jsx` | Add gear icon |
| `frontend/src/components/layout/MobileBottomNav.jsx` | Add Settings tab |
| `frontend/src/App.jsx` | Add `/settings` route |
