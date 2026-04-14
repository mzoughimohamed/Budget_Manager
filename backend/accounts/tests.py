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
