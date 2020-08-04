from django.contrib import admin
from django.urls import path
from socketio_app.views import RENDER_CHAT_HOMEPAGE
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', RENDER_CHAT_HOMEPAGE)
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
