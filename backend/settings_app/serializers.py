from rest_framework import serializers
from .models import UserSettings


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['cycle_start_day']

    def validate_cycle_start_day(self, value):
        if not 1 <= value <= 28:
            raise serializers.ValidationError('Must be between 1 and 28.')
        return value
