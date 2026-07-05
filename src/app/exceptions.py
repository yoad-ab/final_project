class AppError(Exception):
    pass


class NotFoundError(AppError):
    pass


class AlreadyExistsError(AppError):
    pass


class UnknownTypeError(AppError):
    pass
