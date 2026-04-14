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
