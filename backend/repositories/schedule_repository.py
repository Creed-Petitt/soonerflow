from database.models import Schedule
from .base_repository import BaseRepository

class ScheduleRepository(BaseRepository):
    def __init__(self):
        super().__init__(Schedule)
