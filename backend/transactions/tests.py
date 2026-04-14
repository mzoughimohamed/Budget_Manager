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


@pytest.mark.django_db
def test_export_csv_missing_params_returns_400(auth_client):
    response = auth_client.get('/api/export/csv/?start=2026-04-01')
    assert response.status_code == 400


@pytest.mark.django_db
def test_export_pdf_missing_params_returns_400(auth_client):
    response = auth_client.get('/api/export/pdf/?start=2026-04-01')
    assert response.status_code == 400
