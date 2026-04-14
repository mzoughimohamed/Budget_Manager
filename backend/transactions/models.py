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
