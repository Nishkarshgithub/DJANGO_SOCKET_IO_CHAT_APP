import os, eventlet, eventlet.wsgi
from django.core.wsgi import get_wsgi_application
from socketio import Middleware
from socketio_app.views import sio
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "chat.settings")

django_app = get_wsgi_application()
application = Middleware(sio, django_app)
eventlet.wsgi.server(eventlet.listen(('', 8000)), application)