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

    # Income sources are keyed by calendar month (the cycle identifier),
    # not by the date range. Use the calendar month of the cycle start date.
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
