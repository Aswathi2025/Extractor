"""Custom exception handler for DRF."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Custom exception handler that returns consistent error format."""
    response = exception_handler(exc, context)

    if response is not None:
        # Wrap DRF errors into a standard format
        if isinstance(response.data, dict) and 'detail' in response.data:
            response.data = {'error': str(response.data['detail'])}
        elif isinstance(response.data, dict):
            response.data = {'error': response.data}
        return response

    # Unhandled server errors
    logger.exception(f'Unhandled error in {context.get("view")}: {exc}')
    return Response(
        {'error': 'Internal server error'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
