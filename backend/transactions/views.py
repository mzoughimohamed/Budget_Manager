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
