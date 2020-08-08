from rest_framework import serializers
from .models import User, CHAT_DATA, CHAT_THREAD


class USER_DATA_SERIALIZER(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"


class CHAT_DATA_SERIALIZER(serializers.ModelSerializer):
    class Meta:
        model = CHAT_DATA
        fields = "__all__"


class CHAT_THREAD_SERIALIZER(serializers.ModelSerializer):
    class Meta:
        model = CHAT_THREAD
        fields = "__all__"