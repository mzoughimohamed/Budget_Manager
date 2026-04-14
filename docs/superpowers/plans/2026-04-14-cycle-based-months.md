# Cycle-Based Budget Months Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace calendar-month filtering with a configurable salary-cycle period (e.g. Apr 21 – May 20) controlled by a settings page.

**Architecture:** Frontend computes date ranges from a `cycle_start_day` setting; backend becomes a dumb date-range filter. A new `settings_app` Django app stores `UserSettings`. A `useCycleSettings` React Query hook fetches the setting once and is shared across all pages.

**Tech Stack:** Django 4 + DRF, React 18 + Vite, TanStack React Query v5, date-fns, Tailwind CSS, pytest-django, Vitest

---

## File Map

| File | Action |
|---|---|
| `backend/settings_app/__init__.py` | Create (empty) |
| `backend/settings_app/apps.py` | Create |
| `backend/settings_app/models.py` | Create |
| `backend/settings_app/serializers.py` | Create |
| `backend/settings_app/views.py` | Create |
| `backend/settings_app/urls.py` | Create |
| `backend/settings_app/tests.py` | Create |
| `backend/settings_app/migrations/__init__.py` | Create (empty) |
| `backend/settings_app/migrations/0001_initial.py` | Create |
| `backend/budget_app/settings.py` | Modify — add `settings_app` to `INSTALLED_APPS` |
| `backend/budget_app/urls.py` | Modify — add `settings/` route |
| `backend/transactions/views.py` | Modify — swap `month` param for `start`/`end` in 4 views |
| `backend/transactions/tests.py` | Modify — update tests to use new params + add cycle test |
| `frontend/src/api/settings.js` | Create |
| `frontend/src/api/transactions.js` | Modify — change `getTransactions` signature |
| `frontend/src/api/summary.js` | Modify — change `getSummary` signature |
| `frontend/src/hooks/useCycleSettings.js` | Create |
| `frontend/src/components/planning/MonthPicker.jsx` | Modify — add `cycleLabel` prop |
| `frontend/src/components/overview/MonthCalendar.jsx` | Modify — use `cycleStart`/`cycleEnd` |
| `frontend/src/pages/OverviewPage.jsx` | Modify — use cycle range |
| `frontend/src/pages/PlanningPage.jsx` | Modify — use cycle range |
| `frontend/src/pages/TransactionsPage.jsx` | Modify — use cycle range |
| `frontend/src/components/export/ExportForm.jsx` | Modify — use cycle range |
| `frontend/src/pages/SettingsPage.jsx` | Create |
| `frontend/src/components/layout/TopNav.jsx` | Modify — add Settings link |
| `frontend/src/components/layout/MobileBottomNav.jsx` | Modify — add Settings tab |
| `frontend/src/App.jsx` | Modify — add `/settings` route |

---

## Task 1: Backend — `settings_app`

**Files:**
- Create: `backend/settings_app/__init__.py`
- Create: `backend/settings_app/apps.py`
- Create: `backend/settings_app/models.py`
- Create: `backend/settings_app/serializers.py`
- Create: `backend/settings_app/views.py`
- Create: `backend/settings_app/urls.py`
- Create: `backend/settings_app/tests.py`
- Create: `backend/settings_app/migrations/__init__.py`
- Create: `backend/settings_app/migrations/0001_initial.py`
- Modify: `backend/budget_app/settings.py`
- Modify: `backend/budget_app/urls.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/settings_app/tests.py`:

```python
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient


@pytest.fixture
def auth_client(db):
    user = User.objects.create_user(username='admin', password='pass')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_get_settings_returns_default(auth_client):
    response = auth_client.get('/api/settings/')
    assert response.status_code == 200
    assert response.data['cycle_start_day'] == 1


@pytest.mark.django_db
def test_patch_settings_updates_cycle_start_day(auth_client):
    auth_client.get('/api/settings/')  # ensure row exists
    response = auth_client.patch('/api/settings/', {'cycle_start_day': 21}, format='json')
    assert response.status_code == 200
    assert response.data['cycle_start_day'] == 21


@pytest.mark.django_db
def test_patch_settings_rejects_day_above_28(auth_client):
    auth_client.get('/api/settings/')
    response = auth_client.patch('/api/settings/', {'cycle_start_day': 29}, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
def test_patch_settings_rejects_day_below_1(auth_client):
    auth_client.get('/api/settings/')
    response = auth_client.patch('/api/settings/', {'cycle_start_day': 0}, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
def test_settings_unauthenticated_blocked(db):
    client = APIClient()
    response = client.get('/api/settings/')
    assert response.status_code == 403
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
docker compose exec backend pytest backend/settings_app/tests.py -v
```

Expected: `ERROR` — module `settings_app` not found.

- [ ] **Step 3: Create the app files**

`backend/settings_app/__init__.py` — empty file.

`backend/settings_app/apps.py`:
```python
from django.apps import AppConfig


class SettingsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'settings_app'
```

`backend/settings_app/models.py`:
```python
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class UserSettings(models.Model):
    cycle_start_day = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(28)],
    )
```

`backend/settings_app/serializers.py`:
```python
from rest_framework import serializers
from .models import UserSettings


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['cycle_start_day']

    def validate_cycle_start_day(self, value):
        if not 1 <= value <= 28:
            raise serializers.ValidationError('Must be between 1 and 28.')
        return value
```

`backend/settings_app/views.py`:
```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import UserSettings
from .serializers import UserSettingsSerializer


@api_view(['GET', 'PATCH'])
def settings_view(request):
    settings, _ = UserSettings.objects.get_or_create(pk=1)
    if request.method == 'PATCH':
        serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(UserSettingsSerializer(settings).data)
```

`backend/settings_app/urls.py`:
```python
from django.urls import path
from .views import settings_view

urlpatterns = [
    path('settings/', settings_view),
]
```

`backend/settings_app/migrations/__init__.py` — empty file.

`backend/settings_app/migrations/0001_initial.py`:
```python
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='UserSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True,
                                           serialize=False, verbose_name='ID')),
                ('cycle_start_day', models.IntegerField(
                    default=1,
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(28),
                    ],
                )),
            ],
        ),
    ]
```

- [ ] **Step 4: Register the app and URL**

In `backend/budget_app/settings.py`, add `'settings_app'` to `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'accounts',
    'budgets',
    'transactions',
    'settings_app',
]
```

In `backend/budget_app/urls.py`:
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('budgets.urls')),
    path('api/', include('transactions.urls')),
    path('api/', include('settings_app.urls')),
]
```

- [ ] **Step 5: Run the migration**

```bash
docker compose exec backend python manage.py migrate
```

Expected: `Applying settings_app.0001_initial... OK`

- [ ] **Step 6: Run tests — verify they pass**

```bash
docker compose exec backend pytest backend/settings_app/tests.py -v
```

Expected: 5 passed.

- [ ] **Step 7: Commit**

```bash
git add backend/settings_app/ backend/budget_app/settings.py backend/budget_app/urls.py
git commit -m "feat: add settings_app with cycle_start_day setting"
```

---

## Task 2: Backend — Update transaction views to use `start`/`end` params

**Files:**
- Modify: `backend/transactions/views.py`
- Modify: `backend/transactions/tests.py`

- [ ] **Step 1: Update the tests first**

Replace the contents of `backend/transactions/tests.py` with:

```python
import pytest
from datetime import date
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from budgets.models import Category
from transactions.models import Transaction, IncomeSource


@pytest.fixture
def auth_client(db):
    user = User.objects.create_user(username='admin', password='pass')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def category(db):
    return Category.objects.create(name='Food', icon='utensils', color='#F97316', budget_limit=500)


@pytest.mark.django_db
def test_create_expense(auth_client, category):
    response = auth_client.post('/api/transactions/', {
        'amount': '150.00',
        'type': 'expense',
        'category': category.id,
        'date': '2026-04-10',
        'note': 'Groceries'
    }, format='json')
    assert response.status_code == 201
    assert Transaction.objects.count() == 1


@pytest.mark.django_db
def test_list_transactions_by_date_range(auth_client, category):
    # Apr 5 and May 5 — only Apr 5 falls in Apr 1–30 range
    Transaction.objects.create(amount=100, type='expense', category=category, date=date(2026, 4, 5))
    Transaction.objects.create(amount=200, type='expense', category=category, date=date(2026, 5, 5))
    response = auth_client.get('/api/transactions/?start=2026-04-01&end=2026-04-30')
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['amount'] == '100.00'


@pytest.mark.django_db
def test_list_transactions_cycle_range_spans_months(auth_client, category):
    # Cycle Apr 21 – May 20: Apr 25 and May 10 should appear; May 21 should not
    Transaction.objects.create(amount=100, type='expense', category=category, date=date(2026, 4, 25))
    Transaction.objects.create(amount=200, type='expense', category=category, date=date(2026, 5, 10))
    Transaction.objects.create(amount=300, type='expense', category=category, date=date(2026, 5, 21))
    response = auth_client.get('/api/transactions/?start=2026-04-21&end=2026-05-20')
    assert response.status_code == 200
    assert len(response.data) == 2


@pytest.mark.django_db
def test_delete_transaction(auth_client, category):
    tx = Transaction.objects.create(amount=100, type='expense', category=category, date=date(2026, 4, 5))
    response = auth_client.delete(f'/api/transactions/{tx.id}/')
    assert response.status_code == 204


@pytest.mark.django_db
def test_create_income_source(auth_client):
    response = auth_client.post('/api/income-sources/', {
        'name': 'Salary', 'amount': '3000.00', 'month': '2026-04-01'
    }, format='json')
    assert response.status_code == 201
    assert IncomeSource.objects.count() == 1


@pytest.mark.django_db
def test_list_income_sources_by_month(auth_client):
    IncomeSource.objects.create(name='Salary', amount=3000, month=date(2026, 4, 1))
    IncomeSource.objects.create(name='Salary', amount=3000, month=date(2026, 3, 1))
    response = auth_client.get('/api/income-sources/?month=2026-04')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_summary(auth_client, category):
    IncomeSource.objects.create(name='Salary', amount=3000, month=date(2026, 4, 1))
    Transaction.objects.create(amount=150, type='expense', category=category, date=date(2026, 4, 5))
    Transaction.objects.create(amount=200, type='expense', category=category, date=date(2026, 4, 10))
    response = auth_client.get('/api/summary/?start=2026-04-01&end=2026-04-30&month=2026-04')
    assert response.status_code == 200
    assert response.data['total_income'] == '3000.00'
    assert response.data['total_expenses'] == '350.00'
    assert response.data['net_savings'] == '2650.00'
    assert response.data['by_category'][0]['spent'] == '350.00'


@pytest.mark.django_db
def test_summary_cycle_excludes_out_of_range(auth_client, category):
    # Cycle Apr 21 – May 20: expense on May 21 must NOT be counted
    IncomeSource.objects.create(name='Salary', amount=3000, month=date(2026, 4, 1))
    Transaction.objects.create(amount=150, type='expense', category=category, date=date(2026, 4, 25))
    Transaction.objects.create(amount=999, type='expense', category=category, date=date(2026, 5, 21))
    response = auth_client.get('/api/summary/?start=2026-04-21&end=2026-05-20&month=2026-04')
    assert response.status_code == 200
    assert response.data['total_expenses'] == '150.00'


@pytest.mark.django_db
def test_summary_missing_params_returns_400(auth_client):
    response = auth_client.get('/api/summary/?start=2026-04-01')
    assert response.status_code == 400


@pytest.mark.django_db
def test_export_csv(auth_client, category):
    Transaction.objects.create(amount=150, type='expense', category=category, date=date(2026, 4, 5), note='Groceries')
    response = auth_client.get('/api/export/csv/?start=2026-04-01&end=2026-04-30')
    assert response.status_code == 200
    assert response['Content-Type'] == 'text/csv'
    content = response.content.decode()
    assert 'Food' in content
    assert '150' in content


@pytest.mark.django_db
def test_export_pdf(auth_client, category):
    Transaction.objects.create(amount=150, type='expense', category=category, date=date(2026, 4, 5))
    response = auth_client.get('/api/export/pdf/?start=2026-04-01&end=2026-04-30')
    assert response.status_code == 200
    assert response['Content-Type'] == 'application/pdf'
    assert response.content[:4] == b'%PDF'
```

- [ ] **Step 2: Run tests — verify new tests fail**

```bash
docker compose exec backend pytest backend/transactions/tests.py -v
```

Expected: `test_list_transactions_by_date_range`, `test_list_transactions_cycle_range_spans_months`, `test_summary_cycle_excludes_out_of_range`, `test_summary_missing_params_returns_400` FAIL; existing ones PASS (they'll pass until the views change).

- [ ] **Step 3: Update `backend/transactions/views.py`**

Replace the full file:

```python
import csv
from datetime import date as date_type
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum
from django.http import HttpResponse
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from .models import Transaction, IncomeSource
from .serializers import TransactionSerializer, IncomeSourceSerializer
from budgets.models import Category
from budgets.serializers import CategorySerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        qs = Transaction.objects.all()
        if start and end:
            qs = qs.filter(date__gte=start, date__lte=end)
        return qs


class IncomeSourceViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSourceSerializer

    def get_queryset(self):
        month = self.request.query_params.get('month')
        qs = IncomeSource.objects.all()
        if month:
            year, mon = month.split('-')
            qs = qs.filter(month__year=int(year), month__month=int(mon))
        return qs


@api_view(['GET'])
def summary_view(request):
    start = request.query_params.get('start', '')
    end = request.query_params.get('end', '')
    month = request.query_params.get('month', '')
    if not start or not end or not month:
        return Response({'error': 'start, end, and month parameters required'}, status=400)

    year, mon = month.split('-')
    year, mon = int(year), int(mon)

    income_sources = IncomeSource.objects.filter(month__year=year, month__month=mon)
    total_income = income_sources.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    expenses = Transaction.objects.filter(
        type=Transaction.EXPENSE, date__gte=start, date__lte=end
    )
    total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    by_category = []
    for cat in Category.objects.all():
        spent = expenses.filter(category=cat).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        by_category.append({
            'category': CategorySerializer(cat).data,
            'spent': str(spent.quantize(Decimal('0.01'))),
            'limit': str(cat.budget_limit.quantize(Decimal('0.01'))),
            'over_budget': spent > cat.budget_limit > 0,
        })

    return Response({
        'total_income': str(total_income.quantize(Decimal('0.01'))),
        'total_expenses': str(total_expenses.quantize(Decimal('0.01'))),
        'net_savings': str((total_income - total_expenses).quantize(Decimal('0.01'))),
        'by_category': by_category,
    })


@api_view(['GET'])
def export_csv(request):
    start = request.query_params.get('start', '')
    end = request.query_params.get('end', '')
    if not start or not end:
        return Response({'error': 'start and end parameters required'}, status=400)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="budget-{start}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Date', 'Type', 'Category', 'Amount (TND)', 'Note'])

    transactions = Transaction.objects.filter(
        date__gte=start, date__lte=end
    ).select_related('category')

    for tx in transactions:
        writer.writerow([
            tx.date.isoformat(),
            tx.type,
            tx.category.name if tx.category else '',
            str(tx.amount),
            tx.note,
        ])
    return response


@api_view(['GET'])
def export_pdf(request):
    start = request.query_params.get('start', '')
    end = request.query_params.get('end', '')
    if not start or not end:
        return Response({'error': 'start and end parameters required'}, status=400)

    start_date = date_type.fromisoformat(start)
    year, mon = start_date.year, start_date.month

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="budget-{start}.pdf"'

    doc = SimpleDocTemplate(response, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f'Budget Report — {start} to {end}', styles['Title']))
    elements.append(Spacer(1, 12))

    income_sources = IncomeSource.objects.filter(month__year=year, month__month=mon)
    total_income = income_sources.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    transactions = Transaction.objects.filter(
        type=Transaction.EXPENSE, date__gte=start, date__lte=end
    ).select_related('category')
    total_expenses = transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    summary_data = [
        ['Total Income', f'{total_income:.2f} TND'],
        ['Total Expenses', f'{total_expenses:.2f} TND'],
        ['Net Savings', f'{total_income - total_expenses:.2f} TND'],
    ]
    summary_table = Table(summary_data, colWidths=[200, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 12))

    elements.append(Paragraph('Transactions', styles['Heading2']))
    tx_data = [['Date', 'Category', 'Amount (TND)', 'Note']]
    for tx in transactions:
        tx_data.append([
            tx.date.isoformat(),
            tx.category.name if tx.category else '',
            f'{tx.amount:.2f}',
            tx.note or '',
        ])
    if len(tx_data) > 1:
        tx_table = Table(tx_data, colWidths=[80, 120, 100, 180])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightyellow]),
        ]))
        elements.append(tx_table)

    doc.build(elements)
    return response
```

- [ ] **Step 4: Run all backend tests**

```bash
docker compose exec backend pytest -v
```

Expected: All tests pass (including the new cycle tests).

- [ ] **Step 5: Commit**

```bash
git add backend/transactions/views.py backend/transactions/tests.py
git commit -m "feat: switch transaction/summary/export filtering to start+end date range"
```

---

## Task 3: Frontend — API modules + `useCycleSettings` hook

**Files:**
- Create: `frontend/src/api/settings.js`
- Modify: `frontend/src/api/transactions.js`
- Modify: `frontend/src/api/summary.js`
- Create: `frontend/src/hooks/useCycleSettings.js`

- [ ] **Step 1: Create `frontend/src/api/settings.js`**

```js
import client from './client'

export const getSettings = () => client.get('/api/settings/')
export const updateSettings = (data) => client.patch('/api/settings/', data)
```

- [ ] **Step 2: Update `frontend/src/api/transactions.js`**

```js
import client from './client'

export const getTransactions = ({ start, end }) =>
  client.get('/api/transactions/', { params: { start, end } })
export const createTransaction = (data) => client.post('/api/transactions/', data)
export const updateTransaction = (id, data) => client.patch(`/api/transactions/${id}/`, data)
export const deleteTransaction = (id) => client.delete(`/api/transactions/${id}/`)
```

- [ ] **Step 3: Update `frontend/src/api/summary.js`**

```js
import client from './client'

export const getSummary = ({ start, end, month }) =>
  client.get('/api/summary/', { params: { start, end, month } })
```

- [ ] **Step 4: Create `frontend/src/hooks/useCycleSettings.js`**

```js
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { getSettings } from '../api/settings'

export function useCycleSettings() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings().then((r) => r.data),
  })

  const cycleStartDay = data?.cycle_start_day ?? 1

  function cycleRange(month) {
    // month = 'YYYY-MM'
    const [year, mon] = month.split('-').map(Number)
    const start = new Date(year, mon - 1, cycleStartDay)
    // end = same day next month minus 1 day
    // new Date(year, mon, 0) = last day of month `mon-1`
    // new Date(year, mon, cycleStartDay - 1) = day before next cycle start
    const endDate = new Date(year, mon, cycleStartDay - 1)
    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(endDate, 'yyyy-MM-dd')
    return {
      start: startStr,
      end: endStr,
      // null when cycleStartDay=1 so MonthPicker hides the subtitle
      label: cycleStartDay === 1
        ? null
        : `${format(start, 'MMM d')} – ${format(endDate, 'MMM d')}`,
    }
  }

  return { cycleStartDay, cycleRange }
}
```

- [ ] **Step 5: Add Vite proxy for `/api/settings/`**

The existing proxy rule `'/api'` already covers `/api/settings/` — no change needed. Verify `frontend/vite.config.js` still has:

```js
proxy: {
  '/api': {
    target: 'http://backend:8000',
    changeOrigin: true,
  },
},
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/settings.js frontend/src/api/transactions.js \
        frontend/src/api/summary.js frontend/src/hooks/useCycleSettings.js
git commit -m "feat: add settings API, useCycleSettings hook, update transactions/summary API signatures"
```

---

## Task 4: Frontend — Update `MonthPicker` with cycle label

**Files:**
- Modify: `frontend/src/components/planning/MonthPicker.jsx`

- [ ] **Step 1: Update `MonthPicker.jsx`**

```jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'

export default function MonthPicker({ value, onChange, cycleLabel }) {
  const date = new Date(value + '-01')
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-1 rounded hover:bg-gray-100"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="flex flex-col items-center w-32">
        <span className="text-sm font-semibold text-center">
          {format(date, 'MMMM yyyy')}
        </span>
        {cycleLabel && (
          <span className="text-xs text-gray-400">{cycleLabel}</span>
        )}
      </div>
      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        className="p-1 rounded hover:bg-gray-100"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/planning/MonthPicker.jsx
git commit -m "feat: MonthPicker shows cycle date range subtitle"
```

---

## Task 5: Frontend — Update `MonthCalendar` to use cycle range

**Files:**
- Modify: `frontend/src/components/overview/MonthCalendar.jsx`

- [ ] **Step 1: Update `MonthCalendar.jsx`**

```jsx
import { useState } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  parseISO, format, isWithinInterval,
} from 'date-fns'
import DayPanel from './DayPanel'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthCalendar({ transactions, cycleStart, cycleEnd }) {
  const [selectedDate, setSelectedDate] = useState(null)

  const cycleStartDate = parseISO(cycleStart)
  const cycleEndDate = parseISO(cycleEnd)

  const gridStart = startOfWeek(cycleStartDate)
  const gridEnd = endOfWeek(cycleEndDate)
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const txDates = new Set(transactions.map((tx) => tx.date))

  const inCycle = (day) =>
    isWithinInterval(day, { start: cycleStartDate, end: cycleEndDate })

  const handleAddTransaction = (date) => {
    setSelectedDate(null)
    window.location.href = `/transactions?date=${date}`
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Calendar</h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const active = inCycle(day)
            const hasTransactions = txDates.has(dateStr)
            return (
              <button
                key={dateStr}
                onClick={() => active && setSelectedDate(dateStr)}
                className={`
                  relative aspect-square flex items-center justify-center rounded-lg text-sm transition-colors
                  ${!active ? 'text-gray-300 cursor-default' : 'hover:bg-blue-50 cursor-pointer'}
                  ${hasTransactions && active ? 'font-semibold text-app-accent' : ''}
                `}
              >
                {format(day, 'd')}
                {hasTransactions && active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-app-accent" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <DayPanel
          date={selectedDate}
          transactions={transactions}
          onClose={() => setSelectedDate(null)}
          onAddTransaction={handleAddTransaction}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/overview/MonthCalendar.jsx
git commit -m "feat: MonthCalendar grid spans full cycle period"
```

---

## Task 6: Frontend — Update pages to use cycle range

**Files:**
- Modify: `frontend/src/pages/OverviewPage.jsx`
- Modify: `frontend/src/pages/PlanningPage.jsx`
- Modify: `frontend/src/pages/TransactionsPage.jsx`
- Modify: `frontend/src/components/export/ExportForm.jsx`

- [ ] **Step 1: Update `OverviewPage.jsx`**

```jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getSummary } from '../api/summary'
import { getTransactions } from '../api/transactions'
import { useCycleSettings } from '../hooks/useCycleSettings'
import MonthPicker from '../components/planning/MonthPicker'
import StatsRow from '../components/overview/StatsRow'
import BudgetDonutChart from '../components/overview/BudgetDonutChart'
import CategorySidebar from '../components/overview/CategorySidebar'
import MonthCalendar from '../components/overview/MonthCalendar'
import TopCategoryCards from '../components/overview/TopCategoryCards'

export default function OverviewPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const { cycleStartDay, cycleRange } = useCycleSettings()
  const { start, end, label } = cycleRange(month)

  const { data: summary } = useQuery({
    queryKey: ['summary', month, cycleStartDay],
    queryFn: () => getSummary({ start, end, month }).then((r) => r.data),
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', month, cycleStartDay],
    queryFn: () => getTransactions({ start, end }).then((r) => r.data),
  })

  if (!summary) {
    return <div className="flex justify-center py-20 text-gray-400">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Overview</h2>
        <MonthPicker value={month} onChange={setMonth} cycleLabel={label} />
      </div>

      <StatsRow
        totalIncome={summary.total_income}
        totalExpenses={summary.total_expenses}
        netSavings={summary.net_savings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BudgetDonutChart byCategory={summary.by_category} />
          <MonthCalendar transactions={transactions} cycleStart={start} cycleEnd={end} />
          <TopCategoryCards byCategory={summary.by_category} />
        </div>
        <div>
          <CategorySidebar byCategory={summary.by_category} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `PlanningPage.jsx`**

```jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getIncomeSources } from '../api/incomeSources'
import { getCategories } from '../api/categories'
import { useCycleSettings } from '../hooks/useCycleSettings'
import MonthPicker from '../components/planning/MonthPicker'
import IncomeSourcesTable from '../components/planning/IncomeSourcesTable'
import CategoryBudgetTable from '../components/planning/CategoryBudgetTable'

export default function PlanningPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const { cycleRange } = useCycleSettings()
  const { label } = cycleRange(month)

  const { data: incomeSources = [] } = useQuery({
    queryKey: ['incomeSources', month],
    queryFn: () => getIncomeSources(month).then((r) => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Planning</h2>
        <MonthPicker value={month} onChange={setMonth} cycleLabel={label} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeSourcesTable incomeSources={incomeSources} month={month} />
        <CategoryBudgetTable categories={categories} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `TransactionsPage.jsx`**

```jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getTransactions } from '../api/transactions'
import { getCategories } from '../api/categories'
import { useCycleSettings } from '../hooks/useCycleSettings'
import MonthPicker from '../components/planning/MonthPicker'
import TransactionTable from '../components/transactions/TransactionTable'
import TransactionForm from '../components/transactions/TransactionForm'

export default function TransactionsPage() {
  const [searchParams] = useSearchParams()
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [showForm, setShowForm] = useState(!!searchParams.get('date'))
  const [editingTx, setEditingTx] = useState(null)
  const { cycleStartDay, cycleRange } = useCycleSettings()
  const { start, end, label } = cycleRange(month)

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', month, cycleStartDay],
    queryFn: () => getTransactions({ start, end }).then((r) => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  })

  const handleEdit = (tx) => {
    setEditingTx(tx)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingTx(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} cycleLabel={label} />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-app-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        onEdit={handleEdit}
        month={month}
        cycleStartDay={cycleStartDay}
      />

      {showForm && (
        <TransactionForm
          categories={categories}
          onClose={handleClose}
          initialDate={searchParams.get('date')}
          initialData={editingTx}
          month={month}
          cycleStartDay={cycleStartDay}
        />
      )}
    </div>
  )
}
```

Note: `TransactionTable` and `TransactionForm` receive `cycleStartDay` so their `invalidateQueries` calls use the correct cache key `['transactions', month, cycleStartDay]`.

- [ ] **Step 4: Update `TransactionTable.jsx` to use the new query key**

```jsx
import { Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTransaction } from '../../api/transactions'
import { format } from 'date-fns'

export default function TransactionTable({ transactions, onEdit, month, cycleStartDay }) {
  const qc = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', month, cycleStartDay] })
      qc.invalidateQueries({ queryKey: ['summary', month, cycleStartDay] })
    },
  })

  if (transactions.length === 0) {
    return <p className="text-center text-gray-400 py-10">No transactions this month</p>
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Note</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">
                  {format(new Date(tx.date + 'T00:00:00'), 'MMM d')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    tx.type === 'expense' ? 'bg-red-100 text-app-danger' : 'bg-green-100 text-app-success'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{tx.category_detail?.name || '—'}</td>
                <td className={`px-4 py-3 text-right font-semibold ${
                  tx.type === 'expense' ? 'text-app-danger' : 'text-app-success'
                }`}>
                  {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toLocaleString('fr-TN')} TND
                </td>
                <td className="px-4 py-3 text-gray-400">{tx.note || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onEdit(tx)} className="text-gray-400 hover:text-gray-700">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(tx.id)}
                      className="text-gray-400 hover:text-app-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update `TransactionForm.jsx` to use the new query key**

```jsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransaction, updateTransaction } from '../../api/transactions'

export default function TransactionForm({ categories, onClose, initialDate, initialData, month, cycleStartDay }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    category: '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    note: '',
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: initialData.amount,
        type: initialData.type,
        category: initialData.category || '',
        date: initialData.date,
        note: initialData.note || '',
      })
    }
  }, [initialData])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions', month, cycleStartDay] })
    qc.invalidateQueries({ queryKey: ['summary', month, cycleStartDay] })
  }

  const saveMutation = useMutation({
    mutationFn: () => initialData
      ? updateTransaction(initialData.id, form)
      : createTransaction({ ...form, category: form.category || null }),
    onSuccess: () => { invalidate(); onClose() },
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-gray-800">
            {initialData ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            {['expense', 'income'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  form.type === t
                    ? t === 'expense' ? 'bg-app-danger text-white' : 'bg-app-success text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Amount (TND)"
            value={form.amount}
            onChange={set('amount')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
            required
          />
          {form.type === 'expense' && (
            <select
              value={form.category}
              onChange={set('category')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={form.date}
            onChange={set('date')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={form.note}
            onChange={set('note')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!form.amount || saveMutation.isPending}
            className="flex-1 py-2 bg-app-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Update `ExportForm.jsx`**

```jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Table2 } from 'lucide-react'
import client from '../../api/client'
import { useCycleSettings } from '../../hooks/useCycleSettings'

export default function ExportForm() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(null)
  const { cycleRange } = useCycleSettings()

  const handleExport = async (formatType) => {
    setLoading(formatType)
    const { start, end } = cycleRange(month)
    try {
      const response = await client.get(`/api/export/${formatType}/`, {
        params: { start, end },
        responseType: 'blob',
      })
      const ext = formatType === 'csv' ? 'csv' : 'pdf'
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `budget-${start}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md">
      <h3 className="font-semibold text-gray-700 mb-5">Export Monthly Report</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 border-2 border-app-accent text-app-accent py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {loading === 'csv' ? 'Generating…' : <><Table2 size={18} /> CSV</>}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 bg-app-accent text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading === 'pdf' ? 'Generating…' : <><FileText size={18} /> PDF</>}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/OverviewPage.jsx frontend/src/pages/PlanningPage.jsx \
        frontend/src/pages/TransactionsPage.jsx \
        frontend/src/components/transactions/TransactionTable.jsx \
        frontend/src/components/transactions/TransactionForm.jsx \
        frontend/src/components/export/ExportForm.jsx
git commit -m "feat: all pages use cycle-based date ranges"
```

---

## Task 7: Frontend — `SettingsPage` and navigation

**Files:**
- Create: `frontend/src/pages/SettingsPage.jsx`
- Modify: `frontend/src/components/layout/TopNav.jsx`
- Modify: `frontend/src/components/layout/MobileBottomNav.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/pages/SettingsPage.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../api/settings'

export default function SettingsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings().then((r) => r.data),
  })

  const [day, setDay] = useState('')

  useEffect(() => {
    if (data) setDay(String(data.cycle_start_day))
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => updateSettings({ cycle_start_day: Number(day) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const dayNum = Number(day)
  const preview =
    day && dayNum >= 1 && dayNum <= 28
      ? (() => {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), dayNum)
          const end = new Date(now.getFullYear(), now.getMonth() + 1, dayNum - 1)
          return `e.g. your ${format(start, 'MMMM')} cycle runs ${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
        })()
      : null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Settings</h2>
      <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md">
        <h3 className="font-semibold text-gray-700 mb-5">Budget Cycle</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Cycle starts on day
            </label>
            <input
              type="number"
              min="1"
              max="28"
              value={day}
              onChange={(e) => {
                saveMutation.reset()
                setDay(e.target.value)
              }}
              className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
            />
            {preview && (
              <p className="text-xs text-gray-400 mt-1">{preview}</p>
            )}
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!day || dayNum < 1 || dayNum > 28 || saveMutation.isPending}
            className="bg-app-accent text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          {saveMutation.isSuccess && (
            <p className="text-sm text-app-success">Settings saved.</p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-app-danger">Failed to save. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `TopNav.jsx`**

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Wallet, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../api/auth'

const tabs = [
  { to: '/',             label: 'Overview' },
  { to: '/planning',     label: 'Planning' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/export',       label: 'Export' },
  { to: '/settings',     label: 'Settings' },
]

export default function TopNav() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    setUser(null)
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2 font-bold text-app-accent text-lg">
          <Wallet size={20} />
          Budget
        </div>
        <div className="hidden md:flex gap-1">
          {tabs.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-app-accent text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Update `MobileBottomNav.jsx`**

```jsx
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, List, Download, Settings } from 'lucide-react'

const tabs = [
  { to: '/',             label: 'Overview',     icon: LayoutDashboard },
  { to: '/planning',     label: 'Planning',     icon: CalendarDays },
  { to: '/transactions', label: 'Transactions', icon: List },
  { to: '/export',       label: 'Export',       icon: Download },
  { to: '/settings',     label: 'Settings',     icon: Settings },
]

export default function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? 'text-app-accent' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Update `App.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import TopNav from './components/layout/TopNav'
import MobileBottomNav from './components/layout/MobileBottomNav'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import PlanningPage from './pages/PlanningPage'
import TransactionsPage from './pages/TransactionsPage'
import ExportPage from './pages/ExportPage'
import SettingsPage from './pages/SettingsPage'

const queryClient = new QueryClient()

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-app-bg pb-16 md:pb-0">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <MobileBottomNav />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout><OverviewPage /></Layout>}     path="/" />
              <Route element={<Layout><PlanningPage /></Layout>}     path="/planning" />
              <Route element={<Layout><TransactionsPage /></Layout>} path="/transactions" />
              <Route element={<Layout><ExportPage /></Layout>}       path="/export" />
              <Route element={<Layout><SettingsPage /></Layout>}     path="/settings" />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 5: Verify in browser**

With the stack running (`docker compose up`):

1. Open `http://localhost:5173` and log in.
2. Navigate to **Settings** — verify the cycle start day input loads with value `1`.
3. Change cycle start day to `21` and click Save — verify "Settings saved." appears.
4. Navigate to **Overview** — verify the MonthPicker shows `April 2026` with `Apr 21 – May 20` subtitle.
5. The calendar should show days from Apr 21 to May 20; days before Apr 21 and after May 20 should be grey.
6. Click a day inside the cycle (e.g. May 5) — the DayPanel should open.
7. Navigate to **Planning** — verify MonthPicker subtitle appears.
8. Navigate to **Transactions** — verify MonthPicker subtitle and that Add Transaction works.
9. Navigate to **Export** — verify downloading CSV generates a file named `budget-2026-04-21.csv`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/SettingsPage.jsx \
        frontend/src/components/layout/TopNav.jsx \
        frontend/src/components/layout/MobileBottomNav.jsx \
        frontend/src/App.jsx
git commit -m "feat: add Settings page with cycle start day + nav links"
```
