import random
import string

def RANDOM_STRING(length):
    letters = string.ascii_lowercase
    result_str = ''.join(random.choice(letters) for i in range(length))
    return result_str

def RANDOM_PHOTO(NAME):
    return 'https://joeschmoe.io/api/v1/' + NAME

def GET_USER(ROOMKEY):
    from .models import User
    created_by = User.objects.filter(room_key=ROOMKEY[0:8]).first()
    created_for = User.objects.filter(room_key=ROOMKEY[8:16]).first()
    return created_by, created_for