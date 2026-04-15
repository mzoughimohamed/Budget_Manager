# Income List — Design Spec

## Goal

Surface actual income transactions (added from the calendar or the Transactions page) as a visible list on both the Overview and Planning pages. The list updates automatically whenever an income transaction is added, edited, or deleted — no manual refresh needed.

## Architecture

**No backend changes.** Income transactions already exist in the `GET /api/transactions/` endpoint as entries with `type === 'income'`. Both pages simply need to filter and display them.

**New shared component:** `frontend/src/components/shared/IncomeList.jsx` — receives a `transactions` prop, filters for income, renders the list. Used in both Overview and Planning.

**Data flow:**
- Overview already fetches `transactions` for the cycle — passes the same array directly to `IncomeList`. Zero extra API calls.
- Planning adds one new query: `getTransactions({ start, end })` using the cycle range it already computes via `useCycleSettings`.

---

## New File

### `frontend/src/components/shared/IncomeList.jsx`

- Filters `transactions` prop for `type === 'income'`
- Sorts by date descending (most recent first)
- Renders each entry: date (MMM d) · note or `—` · `+X,XXX TND` in green
- Total row at the bottom: `t('income_received_total'): X,XXX TND`
- Empty state: `t('income_received_empty')`
- Card heading: `t('income_received_title')`
- Uses `useTranslation()` for all strings

---

## Modified Files

### `frontend/src/pages/OverviewPage.jsx`

- Import `IncomeList`
- Pass `transactions` to `<IncomeList transactions={transactions} />`
- Position: inside the right sidebar column (`lg:col-span-1`), below `<CategorySidebar />`

### `frontend/src/pages/PlanningPage.jsx`

- Import `getTransactions` from `'../api/transactions'`
- Import `IncomeList`
- Add query: `getTransactions({ start, end })` — requires destructuring `start` and `end` from `cycleRange(month)` (currently only `label` is destructured)
- Position: full-width card below the existing two-column grid

---

## Translation Keys (3 new keys, added to en.js / fr.js / ar.js)

| Key | EN | FR | AR |
|---|---|---|---|
| `income_received_title` | `Income Received` | `Revenus perçus` | `الدخل المحصّل` |
| `income_received_empty` | `No income recorded this cycle` | `Aucun revenu ce cycle` | `لا يوجد دخل مسجّل هذه الدورة` |
| `income_received_total` | `Total` | `Total` | `الإجمالي` |

---

## Edge Cases

- **No income transactions:** Show the empty state message. Do not hide the card entirely — presence of the card reminds the user they can add income from the calendar.
- **Income with no note:** Show `—` in the note column.
- **Real-time updates:** Both pages use TanStack React Query. Adding/editing/deleting a transaction invalidates the `['transactions', month, cycleStartDay]` query key, so `IncomeList` refreshes automatically.
- **Current date / cycle:** The cycle range is already computed by `useCycleSettings()` on both pages. The income list always reflects the selected cycle month, consistent with all other data on the page.
