import socketio
from django.http import HttpResponse
from django.shortcuts import render
from .models import User, CHAT_DATA, CHAT_THREAD
from .serializers import CHAT_DATA_SERIALIZER, USER_DATA_SERIALIZER, \
    CHAT_THREAD_SERIALIZER
from .utils import GET_USER

# TEMPLATE RENDERER
def RENDER_CHAT_HOMEPAGE(request):
    return render(request, 'new_home.html')

# Socket IO Events
sio = socketio.Server(async_mode='eventlet')

# Connect & Disconnect Events
@sio.event
def connect(sid, environ):
    return sio.emit('connection', { 'message': "Server connected with Session ID: {0}".format(sid), 
        "session_key": sid })

@sio.event
def disconnect(sid):
    print('disconnect: ', sid)
    return sio.emit('disconnect', { 'message': "Server disconnected with Session ID: {0}".format(sid), 
        "session_key": sid })

# Register User
@sio.on('REGISTER_COMMAND')
def REGISTER(sid, data):
    if sid == data['session_key']: 
        if User.objects.filter(full_name=data['full_name']).first():
            return sio.emit('USER_ERROR', { "message": "User with name already exist!", 
                'session_key': sid })
        user_data = User.objects.create(full_name=data['full_name'], is_logged=True)
        sio.emit('ONLINE_USERS', { "users_list": USER_DATA_SERIALIZER(User.objects.filter(is_active=True, is_logged=True), many=True).data, "session_key": sid })
        return sio.emit('LOGIN_SUCCESS', { "user_data": USER_DATA_SERIALIZER(user_data).data, 
            "seesion_key": sid })
    return sio.emit('USER_ERROR', { "message": "Session key do not exist!", 
        'session_key': sid })

# Login function
@sio.on('LOGIN_COMMAND')
def LOGIN(sid, data):
    if sid == data['session_key']:
        user_data = User.objects.filter(full_name=data['full_name']).first()
        if user_data:
            user_data.is_logged = True
            user_data.save()
            sio.emit('ONLINE_USERS', { "users_list": USER_DATA_SERIALIZER(User.objects.filter(is_active=True, is_logged=True), many=True).data, "session_key": sid })
            return sio.emit('LOGIN_SUCCESS', {"user_data": 
                USER_DATA_SERIALIZER(user_data).data, "session_key": sid})
        else:
            return sio.emit('USER_ERROR', { "message": "User do not exist with this name!", 
                'session_key': sid })
    return sio.emit('USER_ERROR', { "message": "Session key do not exist!", 
        'session_key': sid })

# Logout Function
@sio.on('LOGOUT_COMMAND')
def LOGOUT(sid, data):
    if sid == data['session_key']:
        user_data = User.objects.filter(full_name=data['full_name']).first()
        if user_data:
            user_data.is_logged = False
            user_data.save()
            sio.emit('ONLINE_USERS', { "users_list": USER_DATA_SERIALIZER(User.objects.filter(is_active=True, is_logged=True), many=True).data, "session_key": sid })
            return sio.emit('LOGOUT_SUCCESS', { "message": "Logout Success!", 
                'session_key': sid })
        else:
            return sio.emit('USER_ERROR', { "message": "No user exist with this name!", 
                'session_key': sid })
    return sio.emit('USER_ERROR', { "message": "Session key do not exist!", 
        'session_key': sid })

# List All Users
@sio.on('USER_LIST')
def LIST_USER(sid, data):
    if sid == data['session_key']:
        return sio.emit('ONLINE_USERS', { "users_list": USER_DATA_SERIALIZER(User.objects.filter(is_active=True, is_logged=True), many=True).data, "session_key": sid })
    return sio.emit('USER_ERROR', { "message": "Session key do not exist!", 
        'session_key': sid })


# @sio.on('FETCH_MESSAGES')
# def FETCH_MESSAGE(sid, data):
#     chats = CHAT_THREAD.objects.filter(room_id=data['ROOM_KEY']).order_by('id').all()
#     return sio.emit('MESSAGES_LIST', CHAT_THREAD_SERIALIZER(chats, many=True).data)


# @sio.on('SEND_MESSAGE')
# def SEND_MESSAGE(sid, data):
#     created_by, created_for = GET_USER(data['room_key'])
#     chat_data = CHAT_THREAD.objects.create(room_id=data['room_key'], 
#         created_by=created_by, created_for=created_for, message=data['message'], 
#         message_type='sent')
#     return sio.emit('MESSAGE_SENDED', CHAT_THREAD_SERIALIZER(chat_data).data)
