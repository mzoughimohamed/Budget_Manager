from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Session auth without CSRF enforcement.

    Safe for use in this app because:
    - CORS restricts requests to http://localhost:5173 only
    - Session cookies are HttpOnly and SameSite=Lax
    - This is a single-user local app with no cross-origin write surface
    """

    def enforce_csrf(self, request):
        return
