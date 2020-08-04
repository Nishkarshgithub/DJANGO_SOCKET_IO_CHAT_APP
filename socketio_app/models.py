from django.db import models
from .utils import RANDOM_STRING

MESSAGE_TYPE = (
    ('sent', 'sent'),
    ('replies', 'replies'),
)

# Simple User Model
class User(models.Model):
    full_name = models.CharField(max_length=128, blank=True, null=True)
    mobile = models.CharField(max_length=128, blank=True, null=True)
    description = models.CharField(max_length=10000, blank=True, null=True)
    photo = models.ImageField(upload_to='users-image/%Y/%m/%d', max_length=80, 
        blank=True, null=True)
    room_key = models.CharField(max_length=8, blank=True, null=True)
    is_logged = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        self.room_key = RANDOM_STRING(8)
        super(User, self).save(*args, **kwargs)

    def __str__(self):
        return self.full_name

# Chat Model
class CHAT_DATA(models.Model):
    created_by = models.ForeignKey(User, related_name='created_by', 
        on_delete=models.DO_NOTHING, null=True, blank=True)
    created_for = models.ForeignKey(User, related_name='created_for', 
        on_delete=models.DO_NOTHING, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    message = models.CharField(max_length=5000, blank=True, null=True)
    message_type = models.CharField(max_length=8, blank=True, null=True, choices=MESSAGE_TYPE)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return "{0} --> {1}, {2}".format(self.created_by.full_name, 
            self.created_for.full_name, self.message)

# Thread Model
class CHAT_THREAD(CHAT_DATA):
    room_id = models.CharField(max_length=16, blank=True, null=True)
    