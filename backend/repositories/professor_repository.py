from database.models import Professor
from .base_repository import BaseRepository

class ProfessorRepository(BaseRepository):
    def __init__(self):
        super().__init__(Professor)
