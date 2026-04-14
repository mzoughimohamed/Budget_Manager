from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('budgets.urls')),
    path('api/', include('transactions.urls')),
    path('api/', include('settings_app.urls')),
]
