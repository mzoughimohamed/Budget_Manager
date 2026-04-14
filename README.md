# Budget App

A personal monthly budgeting application built for a single user. Track income and expenses, set category budget limits, visualize spending, and export monthly reports — accessible from both desktop and mobile.

---

## Features

- **Password-protected** — single-user login wall, no registration
- **Overview dashboard** — monthly stats, donut chart, interactive calendar, category breakdown
- **Income tracking** — add multiple income sources (salary, freelance, etc.) per month
- **Expense categories** — 12 preset categories, fully customizable
- **Budget limits** — set a monthly spending limit per category with overspend indicators
- **Interactive calendar** — days with transactions are highlighted; click any day to view or add transactions
- **Transactions** — log, edit, and delete income and expense entries
- **Planning** — manage income sources and category budget limits by month
- **Export** — download monthly reports as CSV or PDF
- **Mobile-friendly** — responsive layout with bottom tab navigation on small screens

---

## Tech Stack

### Backend
| | |
|---|---|
| Framework | Django 4 + Django REST Framework |
| Database | PostgreSQL 15 |
| Auth | Django session authentication |
| PDF export | ReportLab |
| Tests | pytest-django |

### Frontend
| | |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Data fetching | TanStack React Query v5 |
| HTTP client | Axios (with CSRF support) |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| Tests | Vitest + React Testing Library |

### Infrastructure
| | |
|---|---|
| Containerization | Docker + Docker Compose |
| Services | `db` (Postgres), `backend` (Django), `frontend` (Vite dev server) |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Start the stack

```bash
docker compose up --build
```

Wait until you see:
```
backend  | Starting development server at http://0.0.0.0:8000/
frontend | VITE ready in ...ms
```

The backend automatically runs database migrations and seeds the 12 preset categories on every startup.

### 2. Create your account

In a separate terminal, run:

```bash
docker compose exec backend python manage.py createsuperuser
```

Follow the prompts to set your username and password. This is your login credential.

### 3. Open the app

```
http://localhost:5173
```

Log in with the credentials you just created.

---

## Project Structure

```
budget_app_dockerized/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── manage.py
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── budget_app/           # Django project config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/             # Auth endpoints (login, logout, me)
│   ├── budgets/              # Category model + CRUD API + seed command
│   │   └── management/commands/seed_categories.py
│   └── transactions/         # Transaction, IncomeSource models + APIs
│                             # Summary endpoint + CSV/PDF export
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── api/              # Axios modules (auth, categories, transactions, ...)
        ├── contexts/         # AuthContext
        ├── components/
        │   ├── layout/       # TopNav, MobileBottomNav, ProtectedRoute
        │   ├── overview/     # StatsRow, BudgetDonutChart, CategorySidebar,
        │   │                 # MonthCalendar, DayPanel, TopCategoryCards
        │   ├── planning/     # IncomeSourcesTable, CategoryBudgetTable, MonthPicker
        │   ├── transactions/ # TransactionTable, TransactionForm
        │   └── export/       # ExportForm
        └── pages/            # OverviewPage, PlanningPage, TransactionsPage,
                              # TransactionsPage, ExportPage, LoginPage
```

---

## API Endpoints

All endpoints require authentication except `POST /api/auth/login/`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login/` | Log in with username + password |
| POST | `/api/auth/logout/` | End session |
| GET | `/api/auth/me/` | Get current user |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories/` | List all categories |
| POST | `/api/categories/` | Create a custom category |
| PATCH | `/api/categories/{id}/` | Edit name, icon, color, or budget limit |
| DELETE | `/api/categories/{id}/` | Delete a category |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions/?month=YYYY-MM` | List transactions for a month |
| POST | `/api/transactions/` | Create a transaction |
| PATCH | `/api/transactions/{id}/` | Edit a transaction |
| DELETE | `/api/transactions/{id}/` | Delete a transaction |

### Income Sources
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/income-sources/?month=YYYY-MM` | List income sources for a month |
| POST | `/api/income-sources/` | Add an income source |
| PATCH | `/api/income-sources/{id}/` | Edit an income source |
| DELETE | `/api/income-sources/{id}/` | Delete an income source |

### Summary & Export
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/summary/?month=YYYY-MM` | Monthly totals + per-category breakdown |
| GET | `/api/export/csv/?month=YYYY-MM` | Download transactions as CSV |
| GET | `/api/export/pdf/?month=YYYY-MM` | Download monthly report as PDF |

---

## Preset Categories

Seeded automatically on first startup:

| Category | Icon |
|---|---|
| Food | utensils |
| Transport | car |
| Home/Rent | home |
| Electricity | zap |
| Water | droplets |
| Internet | wifi |
| Healthcare | heart-pulse |
| Entertainment | tv |
| Clothing | shirt |
| Education | book-open |
| Savings | piggy-bank |
| Other | circle-dot |

All categories are fully editable — rename, recolor, change the icon, or set a monthly budget limit.

---

## Development

### Run backend tests

```bash
docker compose exec backend pytest -v
```

> Note: tests require the `db` service to be running (`docker compose up db`).

### Run frontend tests

```bash
docker compose exec frontend npm test
```

Or locally:

```bash
cd frontend && npm test
```

### Seed categories manually

```bash
docker compose exec backend python manage.py seed_categories
```

The command is idempotent — safe to run multiple times.

### Django admin

```bash
# Access at http://localhost:8000/admin/
# Login with your superuser credentials
```

---

## Currency

All amounts are in **Tunisian Dinar (TND)**. Numbers are formatted using the `fr-TN` locale.

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Password gate |
| `/` | Overview | Dashboard: stats, chart, calendar, category breakdown |
| `/planning` | Planning | Manage income sources and category budget limits |
| `/transactions` | Transactions | Log and manage all income and expense entries |
| `/export` | Export | Download monthly CSV or PDF report |
