from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class UserSettings(models.Model):
    cycle_start_day = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(28)],
    )
