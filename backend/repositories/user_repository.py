from database.models import User
from .base_repository import BaseRepository

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)
