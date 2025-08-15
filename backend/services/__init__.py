"""
Services module for business logic.
"""
from .professor_service import ProfessorService
from .class_service import ClassService

__all__ = ["ProfessorService", "ClassService"]