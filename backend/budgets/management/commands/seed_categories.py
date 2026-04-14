from django.core.management.base import BaseCommand
from budgets.models import Category

PRESETS = [
    {'name': 'Food',          'icon': 'utensils',      'color': '#F97316'},
    {'name': 'Transport',     'icon': 'car',            'color': '#3B82F6'},
    {'name': 'Home/Rent',     'icon': 'home',           'color': '#8B5CF6'},
    {'name': 'Electricity',   'icon': 'zap',            'color': '#EAB308'},
    {'name': 'Water',         'icon': 'droplets',       'color': '#06B6D4'},
    {'name': 'Internet',      'icon': 'wifi',           'color': '#6366F1'},
    {'name': 'Healthcare',    'icon': 'heart-pulse',    'color': '#EF4444'},
    {'name': 'Entertainment', 'icon': 'tv',             'color': '#EC4899'},
    {'name': 'Clothing',      'icon': 'shirt',          'color': '#F59E0B'},
    {'name': 'Education',     'icon': 'book-open',      'color': '#10B981'},
    {'name': 'Savings',       'icon': 'piggy-bank',     'color': '#22C55E'},
    {'name': 'Other',         'icon': 'circle-dot',     'color': '#6B7280'},
]


class Command(BaseCommand):
    help = 'Seed preset expense categories'

    def handle(self, *args, **kwargs):
        for data in PRESETS:
            Category.objects.get_or_create(
                name=data['name'],
                defaults={**data, 'is_preset': True, 'budget_limit': 0}
            )
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(PRESETS)} categories'))
