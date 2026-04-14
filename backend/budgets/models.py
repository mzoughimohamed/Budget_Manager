from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='circle')
    color = models.CharField(max_length=7, default='#6B7280')
    budget_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_preset = models.BooleanField(default=False)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
