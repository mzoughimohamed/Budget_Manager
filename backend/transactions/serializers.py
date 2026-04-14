from rest_framework import serializers
from .models import Transaction, IncomeSource
from budgets.serializers import CategorySerializer


class IncomeSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeSource
        fields = ['id', 'name', 'amount', 'month']


class TransactionSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type', 'category', 'category_detail',
                  'income_source', 'date', 'note']
