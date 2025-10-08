from typing import Any, Optional


class AppException(Exception):
    def __init__(self, message: str, details: Optional[Any] = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class NotFoundException(AppException):
    pass


class ValidationException(AppException):
    pass


class DatabaseException(AppException):
    pass


class AuthenticationException(AppException):
    pass


class ConflictException(AppException):
   pass
