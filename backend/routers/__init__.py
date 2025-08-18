"""
Router modules for the OU Class Manager API.
"""
from .classes import router as classes_router
from .professors import router as professors_router
from .users import router as users_router
from .schedules import router as schedules_router
from .majors import router as majors_router
from .prerequisites import router as prerequisites_router
from .flowchart import router as flowchart_router

__all__ = [
    "classes_router",
    "professors_router",
    "users_router",
    "schedules_router",
    "majors_router",
    "prerequisites_router",
    "flowchart_router"
]