import os, socketio
from django.http import HttpResponse
from django.shortcuts import render
from .models import User, CHAT_DATA, CHAT_THREAD
from .serializers import CHAT_DATA_SERIALIZER, USER_CUSTOM_DATASERIALIZER, \
    CHAT_THREAD_SERIALIZER

async_mode = None
basedir = os.path.dirname(os.path.realpath(__file__))
sio = socketio.Server(async_mode='eventlet')\

def RENDER_CHAT_HOMEPAGE(request):
    return render(request, 'home.html')

@sio.event
def connect(sid, environ):
    return sio.emit('connection', 'connection_established')

@sio.event
def disconnect(sid):
    print('disconnect ', sid)

@sio.on('LIST_USER')
def LIST_USER(sid, data):
    if data and data['full_name']:
        return sio.emit('USER_DATA', USER_CUSTOM_DATASERIALIZER(User.objects.filter(is_active=True)
            .exclude(full_name=data), many=True).data)
    else:
        return sio.emit('USER_DATA', USER_CUSTOM_DATASERIALIZER(User.objects.filter(is_active=True)
            .all(), many=True).data)

@sio.on('ADD_USER')
def ADD_USER(sid, data):
    user_data = User.objects.filter(full_name=data).first()
    if user_data:
        return sio.emit('USER_ERROR', 'User with name already exist!')
    else:
        user_data = User.objects.create(full_name=data, is_logged=True)
        return sio.emit('NEW_USER_DATA', {"user_data": 
            USER_CUSTOM_DATASERIALIZER(user_data).data, "is_Authenticated": True})


@sio.on('FETCH_MESSAGES')
def FETCH_MESSAGE(sid, data):
    chats = CHAT_THREAD.objects.filter(room_id=data['ROOM_KEY']).order_by('-id').all()
    print(chats)
    return sio.emit('RECIEVE_MESSAGE', CHAT_THREAD_SERIALIZER(chats, many=True).data)
