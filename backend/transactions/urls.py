from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, IncomeSourceViewSet

router = DefaultRouter()
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('income-sources', IncomeSourceViewSet, basename='incomesource')

urlpatterns = [path('', include(router.urls))]
