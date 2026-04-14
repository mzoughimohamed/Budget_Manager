# Budget App — Design Spec
**Date:** 2026-04-13
**Status:** Approved

---

## Overview

A personal monthly budgeting application for a single user. Accessible from both desktop and mobile. Protected by a password login wall. Built on an existing Docker Compose stack: React 18 + Vite (frontend), Django + Django REST Framework (backend), PostgreSQL (database).

---

## Requirements Summary

| Requirement | Decision |
|---|---|
| Users | Single user, password-protected |
| Currency | Tunisian Dinar (TND) — no multi-currency |
| Income | Starts with Salary; user can add more income sources dynamically |
| Expense categories | Preset list, fully customizable (add/edit/delete) |
| Budget limits | Per-category monthly limit with overspend indicators |
| Calendar | Highlights days with transactions; click day to view/add |
| Export | CSV and PDF, per month |

---

## Architecture

```
React (Vite) ─── Axios ───► Django REST Framework ─── ORM ───► PostgreSQL
     │                              │
     │                        Session Auth
     │                       (login wall)
     │
React Router v6 (pages)
React Query v5 (server state cache)
```

### Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Username + password gate |
| `/` | Overview | Dashboard: stats, donut chart, calendar, top categories |
| `/planning` | Planning | Set monthly budget limits, manage income sources |
| `/transactions` | Transactions | Log, edit, delete income and expense records |
| `/export` | Export | Download monthly CSV or PDF report |

### Backend Django Apps

| App | Responsibility |
|---|---|
| `accounts` | Single-user session authentication |
| `budgets` | Categories and per-category budget limits |
| `transactions` | Income and expense transaction records, income sources |

---

## Data Models

### `Category`
| Field | Type | Notes |
|---|---|---|
| `id` | int | PK |
| `name` | string | e.g. "Food" |
| `icon` | string | Lucide icon name |
| `color` | string | Hex color code |
| `budget_limit` | decimal | Monthly limit in TND — static, applies to every month |
| `is_preset` | bool | True for default categories |

**Preset categories:** Food, Transport, Home/Rent, Electricity, Water, Internet, Healthcare, Entertainment, Clothing, Education, Savings, Other

### `Transaction`
| Field | Type | Notes |
|---|---|---|
| `id` | int | PK |
| `amount` | decimal | TND |
| `type` | enum | `income` or `expense` |
| `category` | FK → Category | Nullable for income type |
| `date` | date | Transaction date |
| `note` | string | Optional |
| `income_source` | FK → IncomeSource | Nullable; for income type |

### `IncomeSource`
| Field | Type | Notes |
|---|---|---|
| `id` | int | PK |
| `name` | string | e.g. "Salary" |
| `amount` | decimal | Monthly amount in TND |
| `month` | date | First day of the month |

---

## API Endpoints

### Auth
- `POST /api/auth/login/` — login with username + password
- `POST /api/auth/logout/` — clear session
- `GET /api/auth/me/` — check session status

### Categories
- `GET /api/categories/` — list all categories
- `POST /api/categories/` — create custom category
- `PATCH /api/categories/{id}/` — edit name, icon, color, budget limit
- `DELETE /api/categories/{id}/` — delete category

### Transactions
- `GET /api/transactions/?month=YYYY-MM` — list transactions for a month
- `POST /api/transactions/` — create transaction
- `PATCH /api/transactions/{id}/` — edit transaction
- `DELETE /api/transactions/{id}/` — delete transaction

### Income Sources
- `GET /api/income-sources/?month=YYYY-MM` — list income sources for a month
- `POST /api/income-sources/` — add income source
- `PATCH /api/income-sources/{id}/` — edit income source
- `DELETE /api/income-sources/{id}/` — delete income source

### Summary
- `GET /api/summary/?month=YYYY-MM` — returns total income, total expenses, net savings, per-category spend vs limit

### Export
- `GET /api/export/csv/?month=YYYY-MM` — download CSV
- `GET /api/export/pdf/?month=YYYY-MM` — download PDF

---

## Frontend Components

### Layout
- `TopNav` — logo, page tabs, user avatar, logout
- `MobileBottomNav` — bottom tab bar shown on small screens
- `ProtectedRoute` — redirects to `/login` if unauthenticated

### Overview Page
- `StatsRow` — three cards: Total Income, Total Expenses, Net Savings
- `BudgetDonutChart` — Recharts donut showing expense breakdown by category
- `CategorySidebar` — list of categories with spent/limit progress bars
- `MonthCalendar` — custom calendar; days with transactions highlighted in blue; click opens `DayPanel`
- `DayPanel` — slide-in panel showing transactions for selected day + "Add Transaction" button
- `TopCategoryCards` — bottom row of top 6 category cards sorted by spend, with icons

### Planning Page
- `IncomeSourcesTable` — add/edit/remove income source rows dynamically; scoped to selected month
- `CategoryBudgetTable` — inline editable budget limits per category; limits are static (same every month)
- `MonthPicker` — selects which month's income sources to view/edit; budget limits are not month-specific

### Transactions Page
- `TransactionTable` — filterable by month, category, type
- `TransactionForm` — modal/drawer for add/edit (amount, type, category, date, note)

### Export Page
- `ExportForm` — month picker + format selector (CSV / PDF)
- `ExportButton` — triggers download

---

## UI Design

**Color palette:**
| Token | Value |
|---|---|
| Background | `#FFF0EE` (soft coral) |
| Card background | `#FFFFFF` |
| Primary accent | `#4F6EF7` (blue) |
| Overspend | `#EF4444` (red) |
| Under budget | `#22C55E` (green) |
| Text primary | `#1F2937` |
| Text secondary | `#6B7280` |

**Libraries:**
- Tailwind CSS — responsive utility-first styling
- Recharts — donut chart, bar charts
- Lucide React — category and UI icons
- date-fns — date formatting and calendar logic
- React Router v6 — client-side routing
- React Query v5 — server state management
- Axios — HTTP client

**Export libraries:**
- `papaparse` — CSV generation
- `@react-pdf/renderer` — PDF generation

**Responsive strategy:**
- Desktop: sidebar layout with categories and calendar on the right
- Mobile: single-column stacked layout, bottom tab navigation, calendar takes full width

---

## Authentication

- Django `django.contrib.auth` with session cookies
- Single superuser account created via `manage.py createsuperuser`
- All DRF views use `IsAuthenticated` permission class
- Session cookie: `SESSION_COOKIE_AGE = 86400` (1 day), `SESSION_COOKIE_HTTPONLY = True`
- Frontend: Axios `withCredentials: true`; 401 response → redirect to `/login`

---

## Out of Scope

- Multi-user support / registration
- Multi-currency conversion
- Recurring transaction automation
- Push notifications
- Bank account sync / import
