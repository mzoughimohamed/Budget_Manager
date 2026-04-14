from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import UserSettings
from .serializers import UserSettingsSerializer


@api_view(['GET', 'PATCH'])
def settings_view(request):
    user_settings, _ = UserSettings.objects.get_or_create(pk=1)
    if request.method == 'PATCH':
        serializer = UserSettingsSerializer(user_settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(UserSettingsSerializer(user_settings).data)
