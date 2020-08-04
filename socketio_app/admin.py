from django.contrib import admin
from .models import User, CHAT_DATA, CHAT_THREAD

admin.site.register(User)
admin.site.register(CHAT_DATA)
admin.site.register(CHAT_THREAD)
