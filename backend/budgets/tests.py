import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from budgets.models import Category


@pytest.fixture
def auth_client(db):
    user = User.objects.create_user(username='admin', password='pass')
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
