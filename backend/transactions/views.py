from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum
from decimal import Decimal
from .models import Transaction, IncomeSource
from .serializers import TransactionSerializer, IncomeSourceSerializer
from budgets.models import Category
from budgets.serializers import CategorySerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        month = self.request.query_params.get('month')
        qs = Transaction.objects.all()
        if month:
            year, mon = month.split('-')
            qs = qs.filter(date__year=int(year), date__month=int(mon))
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
    month = request.query_params.get('month', '')
    if not month:
        return Response({'error': 'month parameter required'}, status=400)

    year, mon = month.split('-')
    year, mon = int(year), int(mon)

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
