# Budget App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack personal monthly budgeting app with Django REST API, React SPA, session auth, category budget limits, interactive calendar, and CSV/PDF export.

**Architecture:** Django REST Framework serves a JSON API protected by session auth; React SPA consumes it via Axios + React Query; PostgreSQL stores all data; entire stack runs in Docker Compose.

**Tech Stack:** Python 3.11, Django 4.2, djangorestframework, django-cors-headers, reportlab, pytest-django | React 18, Vite, React Router v6, @tanstack/react-query v5, Axios, Tailwind CSS v3, Recharts, Lucide React, date-fns, Vitest

---

## File Map

### Backend (new files to create)
```
backend/
  budget_app/
    __init__.py           # empty package marker
    settings.py           # REPLACE: full Django settings
    urls.py               # root URL conf
    wsgi.py               # WSGI entry point
  accounts/
    __init__.py
    views.py              # login, logout, me
    urls.py
    tests.py
  budgets/
    __init__.py
    models.py             # Category
    serializers.py
    views.py              # CategoryViewSet
    urls.py
    management/commands/seed_categories.py
    tests.py
  transactions/
    __init__.py
    models.py             # Transaction, IncomeSource
    serializers.py
    views.py              # TransactionViewSet, IncomeSourceViewSet, SummaryView, ExportCSVView, ExportPDFView
    urls.py
    tests.py
  manage.py               # REPLACE: fix settings module reference
  requirements.txt        # REPLACE: add reportlab, pytest-django
  pytest.ini              # pytest config
```

### Frontend (all new)
```
frontend/
  index.html
  vite.config.js
  tailwind.config.js
  postcss.config.js
  package.json            # REPLACE: add all deps
  src/
    main.jsx
    App.jsx
    api/
      client.js           # axios instance with CSRF
      auth.js
      categories.js
      transactions.js
      incomeSources.js
      summary.js
    contexts/
      AuthContext.jsx
    components/
      layout/
        TopNav.jsx
        MobileBottomNav.jsx
        ProtectedRoute.jsx
      overview/
        StatsRow.jsx
        BudgetDonutChart.jsx
        CategorySidebar.jsx
        MonthCalendar.jsx
        DayPanel.jsx
        TopCategoryCards.jsx
      planning/
        IncomeSourcesTable.jsx
        CategoryBudgetTable.jsx
        MonthPicker.jsx
      transactions/
        TransactionTable.jsx
        TransactionForm.jsx
      export/
        ExportForm.jsx
    pages/
      LoginPage.jsx
      OverviewPage.jsx
      PlanningPage.jsx
      TransactionsPage.jsx
      ExportPage.jsx
    test/
      setup.js
      auth.test.jsx
      ProtectedRoute.test.jsx
```

---

## Task 1: Backend Project Foundation

**Files:**
- Replace: `backend/manage.py`
- Replace: `backend/budget_app/settings.py`
- Create: `backend/budget_app/__init__.py`
- Create: `backend/budget_app/urls.py`
- Create: `backend/budget_app/wsgi.py`
- Replace: `backend/requirements.txt`
- Create: `backend/pytest.ini`

- [ ] **Step 1: Fix manage.py** — the existing file points to `arabic_ocr.settings`, change to `budget_app.settings`

```python
# backend/manage.py
#!/usr/bin/env python
import os
import sys


def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budget_app.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Write complete settings.py**

```python
# backend/budget_app/settings.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-not-for-production')
DEBUG = True
ALLOWED_HOSTS = ['*']

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
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'budget_app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'budget_app.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'budget_db'),
        'USER': os.getenv('DB_USER', 'budget_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'budget_pass'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Tunis'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

CORS_ALLOWED_ORIGINS = ['http://localhost:5173']
CORS_ALLOW_CREDENTIALS = True
CSRF_COOKIE_HTTPONLY = False
CSRF_TRUSTED_ORIGINS = ['http://localhost:5173']
SESSION_COOKIE_AGE = 86400
SESSION_COOKIE_SAMESITE = 'Lax'
```

- [ ] **Step 3: Create `budget_app/__init__.py`** — empty file, just `touch` it

- [ ] **Step 4: Create `budget_app/urls.py`**

```python
# backend/budget_app/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('budgets.urls')),
    path('api/', include('transactions.urls')),
]
```

- [ ] **Step 5: Create `budget_app/wsgi.py`**

```python
# backend/budget_app/wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budget_app.settings')
application = get_wsgi_application()
```

- [ ] **Step 6: Update requirements.txt**

```
django
djangorestframework
psycopg2-binary
django-cors-headers
reportlab
pytest
pytest-django
```

- [ ] **Step 7: Create pytest.ini**

```ini
# backend/pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = budget_app.settings
python_files = tests.py test_*.py
```

- [ ] **Step 8: Verify Django starts** — inside the backend container or locally:

```bash
cd backend && python manage.py check
```
Expected: `System check identified no issues (0 silenced).`

- [ ] **Step 9: Commit**

```bash
git add backend/
git commit -m "feat: initialize Django project foundation for budget app"
```

---

## Task 2: Auth App

**Files:**
- Create: `backend/accounts/__init__.py`
- Create: `backend/accounts/views.py`
- Create: `backend/accounts/urls.py`
- Create: `backend/accounts/tests.py`

- [ ] **Step 1: Create accounts app files** — create `accounts/__init__.py` (empty)

- [ ] **Step 2: Write failing tests first**

```python
# backend/accounts/tests.py
import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_superuser(
        username='testuser', password='testpass123'
    )


@pytest.mark.django_db
def test_login_success(client, user):
    response = client.post('/api/auth/login/', {
        'username': 'testuser', 'password': 'testpass123'
    }, format='json')
    assert response.status_code == 200
    assert response.data['username'] == 'testuser'


@pytest.mark.django_db
def test_login_wrong_password(client, user):
    response = client.post('/api/auth/login/', {
        'username': 'testuser', 'password': 'wrong'
    }, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
def test_me_authenticated(client, user):
    client.force_authenticate(user=user)
    response = client.get('/api/auth/me/')
    assert response.status_code == 200
    assert response.data['username'] == 'testuser'


@pytest.mark.django_db
def test_me_unauthenticated(client):
    response = client.get('/api/auth/me/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_logout(client, user):
    client.force_authenticate(user=user)
    response = client.post('/api/auth/logout/')
    assert response.status_code == 200
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
cd backend && pytest accounts/tests.py -v
```
Expected: `ERROR` — no module `accounts.urls`

- [ ] **Step 4: Implement views.py**

```python
# backend/accounts/views.py
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=400)
    login(request, user)
    return Response({'username': user.username})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'detail': 'Logged out'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response({'username': request.user.username})
```

- [ ] **Step 5: Implement urls.py**

```python
# backend/accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view),
    path('logout/', views.logout_view),
    path('me/', views.me_view),
]
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
cd backend && pytest accounts/tests.py -v
```
Expected: 5 passed

- [ ] **Step 7: Commit**

```bash
git add backend/accounts/
git commit -m "feat: add session auth endpoints (login, logout, me)"
```

---

## Task 3: Budgets App (Category model + API + seed)

**Files:**
- Create: `backend/budgets/__init__.py`
- Create: `backend/budgets/models.py`
- Create: `backend/budgets/serializers.py`
- Create: `backend/budgets/views.py`
- Create: `backend/budgets/urls.py`
- Create: `backend/budgets/management/__init__.py`
- Create: `backend/budgets/management/commands/__init__.py`
- Create: `backend/budgets/management/commands/seed_categories.py`
- Create: `backend/budgets/tests.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/budgets/tests.py
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from budgets.models import Category


@pytest.fixture
def auth_client(db):
    user = User.objects.create_superuser(username='admin', password='pass')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_list_categories(auth_client):
    Category.objects.create(name='Food', icon='utensils', color='#F97316', budget_limit=500)
    response = auth_client.get('/api/categories/')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_create_category(auth_client):
    response = auth_client.post('/api/categories/', {
        'name': 'Transport', 'icon': 'car', 'color': '#3B82F6', 'budget_limit': '300.00'
    }, format='json')
    assert response.status_code == 201
    assert Category.objects.filter(name='Transport').exists()


@pytest.mark.django_db
def test_update_budget_limit(auth_client):
    cat = Category.objects.create(name='Food', icon='utensils', color='#F97316', budget_limit=500)
    response = auth_client.patch(f'/api/categories/{cat.id}/', {'budget_limit': '600.00'}, format='json')
    assert response.status_code == 200
    cat.refresh_from_db()
    assert cat.budget_limit == 600


@pytest.mark.django_db
def test_delete_category(auth_client):
    cat = Category.objects.create(name='Food', icon='utensils', color='#F97316', budget_limit=500)
    response = auth_client.delete(f'/api/categories/{cat.id}/')
    assert response.status_code == 204
    assert not Category.objects.filter(id=cat.id).exists()


@pytest.mark.django_db
def test_unauthenticated_blocked(db):
    client = APIClient()
    response = client.get('/api/categories/')
    assert response.status_code == 403
```

- [ ] **Step 2: Run — verify fail**

```bash
cd backend && pytest budgets/tests.py -v
```
Expected: `ImportError` — budgets app not yet implemented

- [ ] **Step 3: Create models.py**

```python
# backend/budgets/models.py
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='circle')
    color = models.CharField(max_length=7, default='#6B7280')
    budget_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_preset = models.BooleanField(default=False)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
```

- [ ] **Step 4: Create serializers.py**

```python
# backend/budgets/serializers.py
from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'budget_limit', 'is_preset']
```

- [ ] **Step 5: Create views.py**

```python
# backend/budgets/views.py
from rest_framework import viewsets
from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
```

- [ ] **Step 6: Create urls.py**

```python
# backend/budgets/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet)

urlpatterns = [path('', include(router.urls))]
```

- [ ] **Step 7: Create seed management command**

```python
# backend/budgets/management/__init__.py   (empty)
# backend/budgets/management/commands/__init__.py  (empty)

# backend/budgets/management/commands/seed_categories.py
from django.core.management.base import BaseCommand
from budgets.models import Category

PRESETS = [
    {'name': 'Food',          'icon': 'utensils',      'color': '#F97316'},
    {'name': 'Transport',     'icon': 'car',            'color': '#3B82F6'},
    {'name': 'Home/Rent',     'icon': 'home',           'color': '#8B5CF6'},
    {'name': 'Electricity',   'icon': 'zap',            'color': '#EAB308'},
    {'name': 'Water',         'icon': 'droplets',       'color': '#06B6D4'},
    {'name': 'Internet',      'icon': 'wifi',           'color': '#6366F1'},
    {'name': 'Healthcare',    'icon': 'heart-pulse',    'color': '#EF4444'},
    {'name': 'Entertainment', 'icon': 'tv',             'color': '#EC4899'},
    {'name': 'Clothing',      'icon': 'shirt',          'color': '#F59E0B'},
    {'name': 'Education',     'icon': 'book-open',      'color': '#10B981'},
    {'name': 'Savings',       'icon': 'piggy-bank',     'color': '#22C55E'},
    {'name': 'Other',         'icon': 'circle-dot',     'color': '#6B7280'},
]


class Command(BaseCommand):
    help = 'Seed preset expense categories'

    def handle(self, *args, **kwargs):
        for data in PRESETS:
            Category.objects.get_or_create(
                name=data['name'],
                defaults={**data, 'is_preset': True, 'budget_limit': 0}
            )
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(PRESETS)} categories'))
```

- [ ] **Step 8: Run migrations and tests**

```bash
cd backend && python manage.py makemigrations budgets && python manage.py migrate
pytest budgets/tests.py -v
```
Expected: 5 passed

- [ ] **Step 9: Commit**

```bash
git add backend/budgets/ backend/budget_app/
git commit -m "feat: add Category model, CRUD API, and seed command"
```

---

## Task 4: Transactions App

**Files:**
- Create: `backend/transactions/__init__.py`
- Create: `backend/transactions/models.py`
- Create: `backend/transactions/serializers.py`
- Create: `backend/transactions/views.py`
- Create: `backend/transactions/urls.py`
- Create: `backend/transactions/tests.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/transactions/tests.py
import pytest
from datetime import date
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from budgets.models import Category
from transactions.models import Transaction, IncomeSource


@pytest.fixture
def auth_client(db):
    user = User.objects.create_superuser(username='admin', password='pass')
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
def test_list_transactions_by_month(auth_client, category):
    Transaction.objects.create(amount=100, type='expense', category=category, date=date(2026, 4, 5))
    Transaction.objects.create(amount=200, type='expense', category=category, date=date(2026, 3, 5))
    response = auth_client.get('/api/transactions/?month=2026-04')
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['amount'] == '100.00'


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
```

- [ ] **Step 2: Run — verify fail**

```bash
cd backend && pytest transactions/tests.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Create models.py**

```python
# backend/transactions/models.py
from django.db import models
from budgets.models import Category


class IncomeSource(models.Model):
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.DateField()

    class Meta:
        ordering = ['-month']

    def __str__(self):
        return f"{self.name} ({self.month.strftime('%Y-%m')})"


class Transaction(models.Model):
    INCOME = 'income'
    EXPENSE = 'expense'
    TYPE_CHOICES = [(INCOME, 'Income'), (EXPENSE, 'Expense')]

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)
    income_source = models.ForeignKey(IncomeSource, null=True, blank=True, on_delete=models.SET_NULL)
    date = models.DateField()
    note = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.type} {self.amount} on {self.date}"
```

- [ ] **Step 4: Create serializers.py**

```python
# backend/transactions/serializers.py
from rest_framework import serializers
from .models import Transaction, IncomeSource
from budgets.serializers import CategorySerializer


class IncomeSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeSource
        fields = ['id', 'name', 'amount', 'month']


class TransactionSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type', 'category', 'category_detail',
                  'income_source', 'date', 'note']
```

- [ ] **Step 5: Create views.py**

```python
# backend/transactions/views.py
from rest_framework import viewsets
from .models import Transaction, IncomeSource
from .serializers import TransactionSerializer, IncomeSourceSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        month = self.request.query_params.get('month')
        qs = Transaction.objects.all()
        if month:
            year, mon = month.split('-')
            qs = qs.filter(date__year=year, date__month=mon)
        return qs


class IncomeSourceViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSourceSerializer

    def get_queryset(self):
        month = self.request.query_params.get('month')
        qs = IncomeSource.objects.all()
        if month:
            year, mon = month.split('-')
            qs = qs.filter(month__year=year, month__month=mon)
        return qs
```

- [ ] **Step 6: Create urls.py**

```python
# backend/transactions/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, IncomeSourceViewSet

router = DefaultRouter()
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('income-sources', IncomeSourceViewSet, basename='incomesource')

urlpatterns = [path('', include(router.urls))]
```

- [ ] **Step 7: Make migrations and run tests**

```bash
cd backend && python manage.py makemigrations transactions && python manage.py migrate
pytest transactions/tests.py -v
```
Expected: 5 passed

- [ ] **Step 8: Commit**

```bash
git add backend/transactions/
git commit -m "feat: add Transaction and IncomeSource models and CRUD APIs"
```

---

## Task 5: Summary Endpoint

**Files:**
- Modify: `backend/transactions/views.py`
- Modify: `backend/transactions/urls.py`
- Modify: `backend/transactions/tests.py`

- [ ] **Step 1: Add failing test** — append to `backend/transactions/tests.py`

```python
@pytest.mark.django_db
def test_summary(auth_client, category):
    from datetime import date
    IncomeSource.objects.create(name='Salary', amount=3000, month=date(2026, 4, 1))
    Transaction.objects.create(amount=150, type='expense', category=category, date=date(2026, 4, 5))
    Transaction.objects.create(amount=200, type='expense', category=category, date=date(2026, 4, 10))
    response = auth_client.get('/api/summary/?month=2026-04')
    assert response.status_code == 200
    assert response.data['total_income'] == '3000.00'
    assert response.data['total_expenses'] == '350.00'
    assert response.data['net_savings'] == '2650.00'
    assert len(response.data['by_category']) == 1
    assert response.data['by_category'][0]['spent'] == '350.00'
```

- [ ] **Step 2: Run — verify fail**

```bash
cd backend && pytest transactions/tests.py::test_summary -v
```
Expected: 404

- [ ] **Step 3: Add SummaryView to views.py** — add after IncomeSourceViewSet

```python
# append to backend/transactions/views.py
from django.db.models import Sum
from decimal import Decimal
from rest_framework.decorators import api_view
from rest_framework.response import Response
from budgets.models import Category
from budgets.serializers import CategorySerializer


@api_view(['GET'])
def summary_view(request):
    month = request.query_params.get('month', '')
    if not month:
        return Response({'error': 'month parameter required'}, status=400)

    year, mon = month.split('-')

    income_sources = IncomeSource.objects.filter(month__year=year, month__month=mon)
    total_income = income_sources.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    expenses = Transaction.objects.filter(
        type=Transaction.EXPENSE, date__year=year, date__month=mon
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
```

- [ ] **Step 4: Register in urls.py** — replace `backend/transactions/urls.py`

```python
# backend/transactions/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, IncomeSourceViewSet, summary_view

router = DefaultRouter()
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('income-sources', IncomeSourceViewSet, basename='incomesource')

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', summary_view),
]
```

- [ ] **Step 5: Run tests**

```bash
cd backend && pytest transactions/tests.py -v
```
Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add backend/transactions/
git commit -m "feat: add monthly summary endpoint with per-category breakdown"
```

---

## Task 6: Export Endpoints (CSV + PDF)

**Files:**
- Modify: `backend/transactions/views.py`
- Modify: `backend/transactions/urls.py`
- Modify: `backend/transactions/tests.py`

- [ ] **Step 1: Add failing tests** — append to `backend/transactions/tests.py`

```python
@pytest.mark.django_db
def test_export_csv(auth_client, category):
    from datetime import date
    Transaction.objects.create(amount=150, type='expense', category=category, date=date(2026, 4, 5), note='Groceries')
    response = auth_client.get('/api/export/csv/?month=2026-04')
    assert response.status_code == 200
    assert response['Content-Type'] == 'text/csv'
    content = response.content.decode()
    assert 'Food' in content
    assert '150' in content


@pytest.mark.django_db
def test_export_pdf(auth_client, category):
    from datetime import date
    Transaction.objects.create(amount=150, type='expense', category=category, date=date(2026, 4, 5))
    response = auth_client.get('/api/export/pdf/?month=2026-04')
    assert response.status_code == 200
    assert response['Content-Type'] == 'application/pdf'
    assert response.content[:4] == b'%PDF'
```

- [ ] **Step 2: Run — verify fail**

```bash
cd backend && pytest transactions/tests.py::test_export_csv transactions/tests.py::test_export_pdf -v
```
Expected: 404

- [ ] **Step 3: Add export views** — append to `backend/transactions/views.py`

```python
# append to backend/transactions/views.py
import csv
from decimal import Decimal
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


@api_view(['GET'])
def export_csv(request):
    month = request.query_params.get('month', '')
    if not month:
        return Response({'error': 'month parameter required'}, status=400)
    year, mon = month.split('-')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="budget-{month}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Date', 'Type', 'Category', 'Amount (TND)', 'Note'])

    transactions = Transaction.objects.filter(
        date__year=year, date__month=mon
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
    month = request.query_params.get('month', '')
    if not month:
        return Response({'error': 'month parameter required'}, status=400)
    year, mon = month.split('-')

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="budget-{month}.pdf"'

    doc = SimpleDocTemplate(response, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f'Budget Report — {month}', styles['Title']))
    elements.append(Spacer(1, 12))

    # Income
    income_sources = IncomeSource.objects.filter(month__year=year, month__month=mon)
    total_income = income_sources.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    # Expenses
    transactions = Transaction.objects.filter(
        type=Transaction.EXPENSE, date__year=year, date__month=mon
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

    # Transactions table
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

- [ ] **Step 4: Register export URLs** — replace `backend/transactions/urls.py`

```python
# backend/transactions/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet, IncomeSourceViewSet,
    summary_view, export_csv, export_pdf
)

router = DefaultRouter()
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('income-sources', IncomeSourceViewSet, basename='incomesource')

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', summary_view),
    path('export/csv/', export_csv),
    path('export/pdf/', export_pdf),
]
```

- [ ] **Step 5: Run all backend tests**

```bash
cd backend && pytest -v
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/transactions/
git commit -m "feat: add CSV and PDF export endpoints"
```

---

## Task 7: Frontend Foundation

**Files:**
- Replace: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/test/setup.js`

- [ ] **Step 1: Replace package.json**

```json
{
  "name": "budget-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.28.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.359.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^1.4.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 3: Create tailwind.config.js**

```js
// frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#FFF0EE',
        'app-accent': '#4F6EF7',
        'app-danger': '#EF4444',
        'app-success': '#22C55E',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Create postcss.config.js**

```js
// frontend/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Budget</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create src/index.css**

```css
/* frontend/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #FFF0EE;
  min-height: 100vh;
}
```

- [ ] **Step 7: Create test setup**

```js
// frontend/src/test/setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Create src/main.jsx** (placeholder — will be replaced in Task 9)

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div>Loading...</div>
  </React.StrictMode>
)
```

- [ ] **Step 9: Install dependencies** — run inside frontend container or locally

```bash
cd frontend && npm install
```
Expected: `node_modules` populated, no errors

- [ ] **Step 10: Verify Tailwind works**

```bash
cd frontend && npm run build
```
Expected: build completes without errors

- [ ] **Step 11: Commit**

```bash
git add frontend/
git commit -m "feat: set up React frontend with Tailwind, Vite, and test tooling"
```

---

## Task 8: API Client + Auth Context

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/api/auth.js`
- Create: `frontend/src/api/categories.js`
- Create: `frontend/src/api/transactions.js`
- Create: `frontend/src/api/incomeSources.js`
- Create: `frontend/src/api/summary.js`
- Create: `frontend/src/contexts/AuthContext.jsx`
- Create: `frontend/src/test/auth.test.jsx`

- [ ] **Step 1: Write failing test**

```jsx
// frontend/src/test/auth.test.jsx
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

function TestComponent() {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading</div>
  return <div>{user ? `Logged in as ${user}` : 'Not logged in'}</div>
}

test('shows not logged in when unauthenticated', async () => {
  // Mock the /api/auth/me/ call to return 403
  global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 })
  render(<AuthProvider><TestComponent /></AuthProvider>)
  await waitFor(() => {
    expect(screen.getByText('Not logged in')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test
```
Expected: `Cannot find module '../contexts/AuthContext'`

- [ ] **Step 3: Create api/client.js**

```js
// frontend/src/api/client.js
import axios from 'axios'

const client = axios.create({
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
```

- [ ] **Step 4: Create api/auth.js**

```js
// frontend/src/api/auth.js
import client from './client'

export const login = (username, password) =>
  client.post('/api/auth/login/', { username, password })

export const logout = () =>
  client.post('/api/auth/logout/')

export const getMe = () =>
  client.get('/api/auth/me/')
```

- [ ] **Step 5: Create api/categories.js**

```js
// frontend/src/api/categories.js
import client from './client'

export const getCategories = () => client.get('/api/categories/')
export const createCategory = (data) => client.post('/api/categories/', data)
export const updateCategory = (id, data) => client.patch(`/api/categories/${id}/`, data)
export const deleteCategory = (id) => client.delete(`/api/categories/${id}/`)
```

- [ ] **Step 6: Create api/transactions.js**

```js
// frontend/src/api/transactions.js
import client from './client'

export const getTransactions = (month) =>
  client.get('/api/transactions/', { params: { month } })
export const createTransaction = (data) => client.post('/api/transactions/', data)
export const updateTransaction = (id, data) => client.patch(`/api/transactions/${id}/`, data)
export const deleteTransaction = (id) => client.delete(`/api/transactions/${id}/`)
```

- [ ] **Step 7: Create api/incomeSources.js**

```js
// frontend/src/api/incomeSources.js
import client from './client'

export const getIncomeSources = (month) =>
  client.get('/api/income-sources/', { params: { month } })
export const createIncomeSource = (data) => client.post('/api/income-sources/', data)
export const updateIncomeSource = (id, data) => client.patch(`/api/income-sources/${id}/`, data)
export const deleteIncomeSource = (id) => client.delete(`/api/income-sources/${id}/`)
```

- [ ] **Step 8: Create api/summary.js**

```js
// frontend/src/api/summary.js
import client from './client'

export const getSummary = (month) =>
  client.get('/api/summary/', { params: { month } })
```

- [ ] **Step 9: Create AuthContext.jsx**

```jsx
// frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then((res) => setUser(res.data.username))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Step 10: Run tests**

```bash
cd frontend && npm test
```
Expected: 1 passed

- [ ] **Step 11: Commit**

```bash
git add frontend/src/api/ frontend/src/contexts/ frontend/src/test/
git commit -m "feat: add Axios client, API modules, and AuthContext"
```

---

## Task 9: App Router + Layout Components

**Files:**
- Replace: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/components/layout/ProtectedRoute.jsx`
- Create: `frontend/src/components/layout/TopNav.jsx`
- Create: `frontend/src/components/layout/MobileBottomNav.jsx`
- Create: `frontend/src/test/ProtectedRoute.test.jsx`

- [ ] **Step 1: Write failing test**

```jsx
// frontend/src/test/ProtectedRoute.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import ProtectedRoute from '../components/layout/ProtectedRoute'

function wrap(user, loading = false) {
  return (
    <AuthContext.Provider value={{ user, loading }}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders children when authenticated', () => {
  render(wrap('admin'))
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})

test('redirects to login when unauthenticated', () => {
  render(wrap(null))
  expect(screen.getByText('Login Page')).toBeInTheDocument()
})
```

- [ ] **Step 2: Export AuthContext from AuthContext.jsx** — update the export line

```jsx
// In frontend/src/contexts/AuthContext.jsx — add named export of the context itself
export { AuthContext }  // add this after the const AuthContext = createContext(null) line
```

Actually replace the line `const AuthContext = createContext(null)` with:

```jsx
export const AuthContext = createContext(null)
```

- [ ] **Step 3: Run — verify fail**

```bash
cd frontend && npm test
```
Expected: `Cannot find module '../components/layout/ProtectedRoute'`

- [ ] **Step 4: Create ProtectedRoute.jsx**

```jsx
// frontend/src/components/layout/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
```

- [ ] **Step 5: Create TopNav.jsx**

```jsx
// frontend/src/components/layout/TopNav.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Wallet } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../api/auth'

const tabs = [
  { to: '/',             label: 'Overview' },
  { to: '/planning',     label: 'Planning' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/export',       label: 'Export' },
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

- [ ] **Step 6: Create MobileBottomNav.jsx**

```jsx
// frontend/src/components/layout/MobileBottomNav.jsx
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, List, Download } from 'lucide-react'

const tabs = [
  { to: '/',             label: 'Overview',     icon: LayoutDashboard },
  { to: '/planning',     label: 'Planning',     icon: CalendarDays },
  { to: '/transactions', label: 'Transactions', icon: List },
  { to: '/export',       label: 'Export',       icon: Download },
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

- [ ] **Step 7: Create App.jsx**

```jsx
// frontend/src/App.jsx
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
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 8: Create stub pages** (so App.jsx imports resolve — full implementation in later tasks)

```jsx
// frontend/src/pages/OverviewPage.jsx
export default function OverviewPage() { return <div>Overview</div> }

// frontend/src/pages/PlanningPage.jsx
export default function PlanningPage() { return <div>Planning</div> }

// frontend/src/pages/TransactionsPage.jsx
export default function TransactionsPage() { return <div>Transactions</div> }

// frontend/src/pages/ExportPage.jsx
export default function ExportPage() { return <div>Export</div> }

// frontend/src/pages/LoginPage.jsx
export default function LoginPage() { return <div>Login</div> }
```

- [ ] **Step 9: Update main.jsx**

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 10: Run tests**

```bash
cd frontend && npm test
```
Expected: all pass

- [ ] **Step 11: Commit**

```bash
git add frontend/src/
git commit -m "feat: add app router, layout components, and ProtectedRoute"
```

---

## Task 10: Login Page

**Files:**
- Replace: `frontend/src/pages/LoginPage.jsx`

- [ ] **Step 1: Implement LoginPage.jsx**

```jsx
// frontend/src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { login } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(username, password)
      setUser(res.data.username)
      navigate('/')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-app-accent rounded-full p-3 mb-3">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Budget</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
              required
            />
          </div>
          {error && (
            <p className="text-app-danger text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-app-accent text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test
```
Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.jsx
git commit -m "feat: implement login page with session auth"
```

---

## Task 11: Overview Page — StatsRow + Month State

**Files:**
- Replace: `frontend/src/pages/OverviewPage.jsx`
- Create: `frontend/src/components/overview/StatsRow.jsx`
- Create: `frontend/src/components/planning/MonthPicker.jsx`

- [ ] **Step 1: Create MonthPicker.jsx**

```jsx
// frontend/src/components/planning/MonthPicker.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'

export default function MonthPicker({ value, onChange }) {
  const date = new Date(value + '-01')
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-1 rounded hover:bg-gray-100"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-semibold w-28 text-center">
        {format(date, 'MMMM yyyy')}
      </span>
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

- [ ] **Step 2: Create StatsRow.jsx**

```jsx
// frontend/src/components/overview/StatsRow.jsx
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className={`rounded-full p-3 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value} TND</p>
      </div>
    </div>
  )
}

export default function StatsRow({ totalIncome, totalExpenses, netSavings }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Income"
        value={Number(totalIncome).toLocaleString('fr-TN')}
        icon={TrendingUp}
        color="bg-app-success"
      />
      <StatCard
        label="Expenses"
        value={Number(totalExpenses).toLocaleString('fr-TN')}
        icon={TrendingDown}
        color="bg-app-danger"
      />
      <StatCard
        label="Net Savings"
        value={Number(netSavings).toLocaleString('fr-TN')}
        icon={PiggyBank}
        color="bg-app-accent"
      />
    </div>
  )
}
```

- [ ] **Step 3: Create OverviewPage.jsx skeleton with summary query**

```jsx
// frontend/src/pages/OverviewPage.jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getSummary } from '../api/summary'
import { getTransactions } from '../api/transactions'
import MonthPicker from '../components/planning/MonthPicker'
import StatsRow from '../components/overview/StatsRow'
import BudgetDonutChart from '../components/overview/BudgetDonutChart'
import CategorySidebar from '../components/overview/CategorySidebar'
import MonthCalendar from '../components/overview/MonthCalendar'
import TopCategoryCards from '../components/overview/TopCategoryCards'

export default function OverviewPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const { data: summary } = useQuery({
    queryKey: ['summary', month],
    queryFn: () => getSummary(month).then((r) => r.data),
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', month],
    queryFn: () => getTransactions(month).then((r) => r.data),
  })

  if (!summary) {
    return <div className="flex justify-center py-20 text-gray-400">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Overview</h2>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <StatsRow
        totalIncome={summary.total_income}
        totalExpenses={summary.total_expenses}
        netSavings={summary.net_savings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BudgetDonutChart byCategory={summary.by_category} />
          <MonthCalendar transactions={transactions} month={month} />
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

- [ ] **Step 4: Run tests**

```bash
cd frontend && npm test
```
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add overview page skeleton with stats row and month picker"
```

---

## Task 12: Overview — BudgetDonutChart

**Files:**
- Create: `frontend/src/components/overview/BudgetDonutChart.jsx`

- [ ] **Step 1: Create BudgetDonutChart.jsx**

```jsx
// frontend/src/components/overview/BudgetDonutChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function BudgetDonutChart({ byCategory }) {
  const data = byCategory
    .filter((item) => Number(item.spent) > 0)
    .map((item) => ({
      name: item.category.name,
      value: Number(item.spent),
      color: item.category.color,
    }))

  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center h-64 text-gray-400 text-sm">
        No expenses this month
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Budget Breakdown</h3>
        <span className="text-sm text-gray-500">{total.toLocaleString('fr-TN')} TND total</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value.toLocaleString('fr-TN')} TND`]}
          />
          <Legend
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test
```
Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/overview/BudgetDonutChart.jsx
git commit -m "feat: add budget donut chart to overview"
```

---

## Task 13: Overview — CategorySidebar

**Files:**
- Create: `frontend/src/components/overview/CategorySidebar.jsx`

- [ ] **Step 1: Create CategorySidebar.jsx**

```jsx
// frontend/src/components/overview/CategorySidebar.jsx
export default function CategorySidebar({ byCategory }) {
  const active = byCategory.filter((item) => Number(item.limit) > 0 || Number(item.spent) > 0)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">Categories</h3>
      <div className="space-y-4">
        {active.map(({ category, spent, limit, over_budget }) => {
          const spentNum = Number(spent)
          const limitNum = Number(limit)
          const pct = limitNum > 0 ? Math.min((spentNum / limitNum) * 100, 100) : 0
          return (
            <div key={category.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                <span className={`text-xs font-semibold ${over_budget ? 'text-app-danger' : 'text-gray-500'}`}>
                  {spentNum.toLocaleString('fr-TN')}
                  {limitNum > 0 && ` / ${limitNum.toLocaleString('fr-TN')}`} TND
                </span>
              </div>
              {limitNum > 0 && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over_budget ? 'bg-app-danger' : 'bg-app-success'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
        {active.length === 0 && (
          <p className="text-sm text-gray-400">No categories with activity</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/overview/CategorySidebar.jsx
git commit -m "feat: add category sidebar with budget progress bars"
```

---

## Task 14: Overview — MonthCalendar + DayPanel

**Files:**
- Create: `frontend/src/components/overview/MonthCalendar.jsx`
- Create: `frontend/src/components/overview/DayPanel.jsx`

- [ ] **Step 1: Create DayPanel.jsx**

```jsx
// frontend/src/components/overview/DayPanel.jsx
import { X, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function DayPanel({ date, transactions, onClose, onAddTransaction }) {
  const dayTransactions = transactions.filter((tx) => tx.date === date)
  const formattedDate = format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d yyyy')

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm h-full shadow-2xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">{formattedDate}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          {dayTransactions.length === 0 ? (
            <p className="text-sm text-gray-400">No transactions on this day</p>
          ) : (
            dayTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {tx.category_detail?.name || tx.type}
                  </p>
                  {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-app-danger' : 'text-app-success'}`}>
                  {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toLocaleString('fr-TN')} TND
                </span>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => onAddTransaction(date)}
          className="w-full flex items-center justify-center gap-2 bg-app-accent text-white py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create MonthCalendar.jsx**

```jsx
// frontend/src/components/overview/MonthCalendar.jsx
import { useState } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, format, isSameMonth
} from 'date-fns'
import DayPanel from './DayPanel'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthCalendar({ transactions, month }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const monthDate = new Date(month + '-01')
  const start = startOfWeek(startOfMonth(monthDate))
  const end = endOfWeek(endOfMonth(monthDate))
  const days = eachDayOfInterval({ start, end })

  const txDates = new Set(transactions.map((tx) => tx.date))

  const handleAddTransaction = (date) => {
    setSelectedDate(null)
    setShowAddForm(true)
    // TransactionForm integration happens in Task 17
    // For now, navigate to transactions page with pre-filled date
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
            const inMonth = isSameMonth(day, monthDate)
            const hasTransactions = txDates.has(dateStr)
            return (
              <button
                key={dateStr}
                onClick={() => inMonth && setSelectedDate(dateStr)}
                className={`
                  relative aspect-square flex items-center justify-center rounded-lg text-sm transition-colors
                  ${!inMonth ? 'text-gray-300 cursor-default' : 'hover:bg-blue-50 cursor-pointer'}
                  ${hasTransactions && inMonth ? 'font-semibold text-app-accent' : ''}
                `}
              >
                {format(day, 'd')}
                {hasTransactions && inMonth && (
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

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/overview/MonthCalendar.jsx frontend/src/components/overview/DayPanel.jsx
git commit -m "feat: add interactive calendar with day panel"
```

---

## Task 15: Overview — TopCategoryCards

**Files:**
- Create: `frontend/src/components/overview/TopCategoryCards.jsx`

- [ ] **Step 1: Create TopCategoryCards.jsx**

```jsx
// frontend/src/components/overview/TopCategoryCards.jsx
import * as LucideIcons from 'lucide-react'

function getIcon(iconName) {
  // Convert kebab-case to PascalCase: 'heart-pulse' -> 'HeartPulse'
  const pascal = iconName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
  return LucideIcons[pascal] || LucideIcons.CircleDot
}

export default function TopCategoryCards({ byCategory }) {
  const top6 = [...byCategory]
    .filter((item) => Number(item.spent) > 0)
    .sort((a, b) => Number(b.spent) - Number(a.spent))
    .slice(0, 6)

  if (top6.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">Top Spending Categories</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {top6.map(({ category, spent }) => {
          const Icon = getIcon(category.icon)
          return (
            <div
              key={category.id}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: category.color + '22' }}
              >
                <Icon size={22} style={{ color: category.color }} />
              </div>
              <p className="text-xs font-medium text-gray-600 text-center leading-tight">{category.name}</p>
              <p className="text-xs text-gray-400">{Number(spent).toLocaleString('fr-TN')} TND</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/overview/TopCategoryCards.jsx
git commit -m "feat: add top spending category cards to overview"
```

---

## Task 16: Planning Page

**Files:**
- Replace: `frontend/src/pages/PlanningPage.jsx`
- Create: `frontend/src/components/planning/IncomeSourcesTable.jsx`
- Create: `frontend/src/components/planning/CategoryBudgetTable.jsx`

- [ ] **Step 1: Create IncomeSourcesTable.jsx**

```jsx
// frontend/src/components/planning/IncomeSourcesTable.jsx
import { useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
  createIncomeSource, updateIncomeSource, deleteIncomeSource
} from '../../api/incomeSources'

export default function IncomeSourcesTable({ incomeSources, month }) {
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [editId, setEditId] = useState(null)
  const [editAmount, setEditAmount] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['incomeSources', month] })

  const addMutation = useMutation({
    mutationFn: () => createIncomeSource({ name: newName, amount: newAmount, month: month + '-01' }),
    onSuccess: () => { setNewName(''); setNewAmount(''); invalidate() },
  })

  const updateMutation = useMutation({
    mutationFn: (id) => updateIncomeSource(id, { amount: editAmount }),
    onSuccess: () => { setEditId(null); invalidate() },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteIncomeSource,
    onSuccess: invalidate,
  })

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">Income Sources</h3>
      <div className="space-y-2 mb-4">
        {incomeSources.map((src) => (
          <div key={src.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="flex-1 text-sm font-medium text-gray-700">{src.name}</span>
            {editId === src.id ? (
              <>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-28 border rounded px-2 py-1 text-sm"
                />
                <button onClick={() => updateMutation.mutate(src.id)} className="text-app-success"><Check size={16} /></button>
                <button onClick={() => setEditId(null)} className="text-gray-400"><X size={16} /></button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setEditId(src.id); setEditAmount(src.amount) }}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  {Number(src.amount).toLocaleString('fr-TN')} TND
                </button>
                <button onClick={() => deleteMutation.mutate(src.id)} className="text-app-danger hover:opacity-70">
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Source name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
        />
        <input
          type="number"
          placeholder="Amount"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          className="w-28 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!newName || !newAmount}
          className="bg-app-accent text-white px-3 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create CategoryBudgetTable.jsx**

```jsx
// frontend/src/components/planning/CategoryBudgetTable.jsx
import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { updateCategory } from '../../api/categories'
import * as LucideIcons from 'lucide-react'

function getIcon(iconName) {
  const pascal = iconName.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  return LucideIcons[pascal] || LucideIcons.CircleDot
}

export default function CategoryBudgetTable({ categories }) {
  const qc = useQueryClient()
  const [editId, setEditId] = useState(null)
  const [editLimit, setEditLimit] = useState('')

  const updateMutation = useMutation({
    mutationFn: (id) => updateCategory(id, { budget_limit: editLimit }),
    onSuccess: () => {
      setEditId(null)
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-1">Category Budget Limits</h3>
      <p className="text-xs text-gray-400 mb-4">Limits apply to every month</p>
      <div className="space-y-2">
        {categories.map((cat) => {
          const Icon = getIcon(cat.icon)
          return (
            <div key={cat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color + '22' }}>
                <Icon size={16} style={{ color: cat.color }} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700">{cat.name}</span>
              {editId === cat.id ? (
                <>
                  <input
                    type="number"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    className="w-28 border rounded px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button onClick={() => updateMutation.mutate(cat.id)} className="text-app-success"><Check size={16} /></button>
                  <button onClick={() => setEditId(null)} className="text-gray-400"><X size={16} /></button>
                </>
              ) : (
                <button
                  onClick={() => { setEditId(cat.id); setEditLimit(cat.budget_limit) }}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  {Number(cat.budget_limit) > 0
                    ? `${Number(cat.budget_limit).toLocaleString('fr-TN')} TND`
                    : 'Set limit'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement PlanningPage.jsx**

```jsx
// frontend/src/pages/PlanningPage.jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getIncomeSources } from '../api/incomeSources'
import { getCategories } from '../api/categories'
import MonthPicker from '../components/planning/MonthPicker'
import IncomeSourcesTable from '../components/planning/IncomeSourcesTable'
import CategoryBudgetTable from '../components/planning/CategoryBudgetTable'

export default function PlanningPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

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
        <MonthPicker value={month} onChange={setMonth} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeSourcesTable incomeSources={incomeSources} month={month} />
        <CategoryBudgetTable categories={categories} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/PlanningPage.jsx frontend/src/components/planning/
git commit -m "feat: implement planning page with income sources and category budget limits"
```

---

## Task 17: Transactions Page

**Files:**
- Replace: `frontend/src/pages/TransactionsPage.jsx`
- Create: `frontend/src/components/transactions/TransactionTable.jsx`
- Create: `frontend/src/components/transactions/TransactionForm.jsx`

- [ ] **Step 1: Create TransactionForm.jsx**

```jsx
// frontend/src/components/transactions/TransactionForm.jsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransaction, updateTransaction } from '../../api/transactions'

export default function TransactionForm({ categories, onClose, initialDate, initialData, month }) {
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
    qc.invalidateQueries({ queryKey: ['transactions', month] })
    qc.invalidateQueries({ queryKey: ['summary', month] })
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

- [ ] **Step 2: Create TransactionTable.jsx**

```jsx
// frontend/src/components/transactions/TransactionTable.jsx
import { Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTransaction } from '../../api/transactions'
import { format } from 'date-fns'

export default function TransactionTable({ transactions, onEdit, month }) {
  const qc = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', month] })
      qc.invalidateQueries({ queryKey: ['summary', month] })
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

- [ ] **Step 3: Implement TransactionsPage.jsx**

```jsx
// frontend/src/pages/TransactionsPage.jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getTransactions } from '../api/transactions'
import { getCategories } from '../api/categories'
import MonthPicker from '../components/planning/MonthPicker'
import TransactionTable from '../components/transactions/TransactionTable'
import TransactionForm from '../components/transactions/TransactionForm'

export default function TransactionsPage() {
  const [searchParams] = useSearchParams()
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [showForm, setShowForm] = useState(!!searchParams.get('date'))
  const [editingTx, setEditingTx] = useState(null)

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', month],
    queryFn: () => getTransactions(month).then((r) => r.data),
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
          <MonthPicker value={month} onChange={setMonth} />
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
      />

      {showForm && (
        <TransactionForm
          categories={categories}
          onClose={handleClose}
          initialDate={searchParams.get('date')}
          initialData={editingTx}
          month={month}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/TransactionsPage.jsx frontend/src/components/transactions/
git commit -m "feat: implement transactions page with add/edit/delete"
```

---

## Task 18: Export Page

**Files:**
- Replace: `frontend/src/pages/ExportPage.jsx`
- Create: `frontend/src/components/export/ExportForm.jsx`

- [ ] **Step 1: Create ExportForm.jsx**

```jsx
// frontend/src/components/export/ExportForm.jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { Download, FileText, Table2 } from 'lucide-react'
import client from '../../api/client'

export default function ExportForm() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(null)

  const handleExport = async (formatType) => {
    setLoading(formatType)
    try {
      const response = await client.get(`/api/export/${formatType}/`, {
        params: { month },
        responseType: 'blob',
      })
      const ext = formatType === 'csv' ? 'csv' : 'pdf'
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `budget-${month}.${ext}`
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

- [ ] **Step 2: Implement ExportPage.jsx**

```jsx
// frontend/src/pages/ExportPage.jsx
import { Download } from 'lucide-react'
import ExportForm from '../components/export/ExportForm'

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-gray-800">Export</h2>
      </div>
      <ExportForm />
    </div>
  )
}
```

- [ ] **Step 3: Run all frontend tests**

```bash
cd frontend && npm test
```
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/ExportPage.jsx frontend/src/components/export/
git commit -m "feat: implement export page with CSV and PDF download"
```

---

## Task 19: Wire Up Docker + First Run

**Files:**
- Modify: `docker-compose.yml` — add seed_categories to backend startup command

- [ ] **Step 1: Update docker-compose.yml backend command**

```yaml
# In docker-compose.yml, replace the backend command with:
command: sh -c "python manage.py migrate && python manage.py seed_categories && python manage.py runserver 0.0.0.0:8000"
```

- [ ] **Step 2: Create the superuser** — run this once after first `docker compose up`

```bash
docker compose exec backend python manage.py createsuperuser
```
Follow prompts: set your username and password. This is your login credential.

- [ ] **Step 3: Start the full stack**

```bash
docker compose up --build
```
Expected output:
- `db` — PostgreSQL ready on port 5432
- `backend` — Django running on port 8000, migrations applied, categories seeded
- `frontend` — Vite dev server on port 5173

- [ ] **Step 4: Smoke test**

Open `http://localhost:5173` in browser.
- Should redirect to `/login`
- Log in with the superuser credentials
- Should land on Overview dashboard
- Navigate to Planning → set a budget limit for Food
- Navigate to Transactions → add a test expense
- Return to Overview → verify the donut chart and stats update
- Navigate to Export → download CSV → open file and confirm it contains the transaction

- [ ] **Step 5: Final commit**

```bash
git add docker-compose.yml
git commit -m "feat: wire up Docker stack with auto-seed and full build"
```

---

## Spec Coverage Check

| Requirement | Task(s) |
|---|---|
| Single user, password-protected | Task 2 (auth), Task 10 (login page), Task 9 (ProtectedRoute) |
| Tunisian Dinar | Task 11+ (fr-TN locale formatting throughout) |
| Salary + dynamic income sources | Task 4 (IncomeSource model), Task 16 (IncomeSourcesTable) |
| Preset categories | Task 3 (seed_categories command), Task 19 (auto-seed on startup) |
| Budget limits per category | Task 3 (Category.budget_limit), Task 16 (CategoryBudgetTable), Task 5 (summary over_budget flag), Task 13 (CategorySidebar progress bars) |
| Calendar highlights + click-to-view | Task 14 (MonthCalendar + DayPanel) |
| CSV export | Task 6 (backend), Task 18 (frontend) |
| PDF export | Task 6 (backend reportlab), Task 18 (frontend) |
| Mobile-friendly | Tasks 9 (MobileBottomNav), all components use Tailwind responsive classes |
