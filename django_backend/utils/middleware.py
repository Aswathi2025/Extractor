"""Custom middlewares."""

from django.urls import resolve, Resolver404

class TrailingSlashMiddleware:
    """
    Silently adds a trailing slash to all incoming request URLs ONLY IF
    the URL doesn't resolve without it, but does resolve with it.
    This prevents Django from throwing a 500 RuntimeError when a POST request
    is made without a trailing slash, and fixes 404s for URLs defined without slashes.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path_info.endswith('/'):
            try:
                resolve(request.path_info)
            except Resolver404:
                try:
                    resolve(request.path_info + '/')
                    request.path_info = request.path_info + '/'
                except Resolver404:
                    pass
        return self.get_response(request)

import traceback
class ExceptionLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        with open('error_log.txt', 'a') as log_file:
            log_file.write(f'Exception on {request.path}: {exception}\n')
            log_file.write(traceback.format_exc() + '\n')
        return None
