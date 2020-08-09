import socketio
from django.http import HttpResponse
from django.shortcuts import render
from .models import User, CHAT_DATA, CHAT_THREAD
from .serializers import CHAT_DATA_SERIALIZER, USER_DATA_SERIALIZER, \
    CHAT_THREAD_SERIALIZER
from .utils import CHAT_DATA, GET_USER, NEW_CHAT_CREATE, DELETE_CHAT

# TEMPLATE RENDERER
def RENDER_CHAT_HOMEPAGE(request):
    return render(request, 'home.html')

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

# Fetch all chat data
@sio.on('FETCH_CHAT_DATA')
def FETCH_CHAT_DATA(sid, data):
    '''
    sid = data['session_key'],
    target_user = data['target_name']
    your_name = data['full_name']
    '''
    if sid == data['session_key']:
        created_by, created_for = GET_USER(data['target_name'], data['full_name'])
        data = CHAT_DATA(created_by, created_for)
        return sio.emit('USER_CHAT_DATA', { "chat_data": CHAT_DATA_SERIALIZER(data, many=True).data, 
            "session_key": sid, "target_user": USER_DATA_SERIALIZER(created_for).data })
    return sio.emit('USER_ERROR', { "message": "Session key do not exist!", 
        'session_key': sid })

# Send message/chat
@sio.on('SEND_NEW_MESSAGE')
def SEND_NEW_MESSAGE(sid, data):
    if sid == data['session_key']:
        created_by, created_for = GET_USER(data['target_user'], data['full_name'])
        if created_for.is_logged == False:
            return sio.emit('USER_ERROR', { "message": "{0} is Offline!".format(created_for.full_name), 
                'session_key': sid })
        data = NEW_CHAT_CREATE(created_by, created_for, data['message'])
        return sio.emit('NEW_CHAT_DATA', { "chat_data": CHAT_DATA_SERIALIZER(data).data, 
            "reciever": USER_DATA_SERIALIZER(created_for).data, 'sender': USER_DATA_SERIALIZER(created_by).data })
    return sio.emit('USER_ERROR', { "message": "Session key do not exist!", 
        'session_key': sid })

# broadcast message/chat
@sio.on('BROADCAST_MESSAGE')
def BROADCAST_MESSAGE(sid, data):
    if sid == data['session_key']:
        USER_LIST = list(data['users_list'].split(","))
        CURRENT_USER, MESSAGE = data['full_name'], data['message']
        for i in range(len(USER_LIST)):
            created_by, created_for = GET_USER(USER_LIST[i], CURRENT_USER)
            data = NEW_CHAT_CREATE(created_by, created_for, MESSAGE)
            sio.emit('NEW_CHAT_DATA', { "chat_data": CHAT_DATA_SERIALIZER(data).data, 
                "reciever": USER_DATA_SERIALIZER(created_for).data, 'sender': USER_DATA_SERIALIZER(created_by).data })
        return sio.emit('BROADCAST_SUCCESS', { "message": "Broadcast completed successfully!", 
        'session_key': sid })
    return sio.emit('USER_ERROR', { "message": "Session key do not exist!", 
        'session_key': sid })

# Delete all chat
@sio.on('DELETE_MESSAGE')
def DELETE_MESSAGE(sid, data):
    if sid == data['session_key']:
        created_by, created_for = GET_USER(data['target_user'], data['full_name'])
        DELETE_CHAT(created_by, created_for)
        return sio.emit('DELETE_SUCCESS', { "message": 'All chat deleted successfully!', 
            'session_key': sid, 'target_name': USER_DATA_SERIALIZER(created_for).data})
    return sio.emit('USER_ERROR', { "message": "Session key do not exist!", 
        'session_key': sid })

