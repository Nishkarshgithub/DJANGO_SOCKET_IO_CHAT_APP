import random, string
from itertools import chain

def RANDOM_STRING(length):
    letters = string.ascii_lowercase
    result_str = ''.join(random.choice(letters) for i in range(length))
    return result_str

def RANDOM_PHOTO(NAME):
    return 'https://joeschmoe.io/api/v1/' + NAME

def GET_USER(TARGET_USER, CURRENT_USER):
    from .models import User
    created_for = User.objects.filter(full_name=TARGET_USER).first()
    created_by = User.objects.filter(full_name=CURRENT_USER).first()
    return created_by, created_for

def CHAT_DATA(CURRENT_USER, TARGET_USER):
    from .models import CHAT_DATA
    sent_by = CHAT_DATA.objects.filter(created_by=CURRENT_USER, created_for=TARGET_USER).all()
    replied_by = CHAT_DATA.objects.filter(created_by=TARGET_USER, created_for=CURRENT_USER).all()
    result_list = sorted(chain(sent_by, replied_by), key=lambda instance: instance.created_at)
    return result_list

def NEW_CHAT_CREATE(CURRENT_USER, TARGET_USER, MESSAGE):
    from .models import CHAT_DATA
    chat_data = CHAT_DATA.objects.create(created_by=CURRENT_USER, created_for=TARGET_USER, 
        message=MESSAGE, message_type='sent')
    chat_data.save()
    return chat_data

