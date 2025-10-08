from database.models import Class
from .base_repository import BaseRepository

class ClassRepository(BaseRepository):
    def __init__(self):
        super().__init__(Class)
