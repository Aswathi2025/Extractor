"""Custom DRF pagination — mirrors pagination.js."""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'limit'
    page_query_param = 'page'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'meta': {
                'totalItems': self.page.paginator.count,
                'totalPages': self.page.paginator.num_pages,
                'page': self.page.number,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
            }
        })

    def get_paginated_response_schema(self, schema):
        return {
            'type': 'object',
            'properties': {
                'data': schema,
                'meta': {
                    'type': 'object',
                    'properties': {
                        'totalItems': {'type': 'integer'},
                        'totalPages': {'type': 'integer'},
                        'page': {'type': 'integer'},
                        'next': {'type': 'string', 'nullable': True},
                        'previous': {'type': 'string', 'nullable': True},
                    }
                }
            },
        }
