from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """
    Full CRUD REST API for Student records (SOP section 7.6):

    GET    /api/students/          -> list (supports ?search= and ?course=)
    POST   /api/students/          -> create
    GET    /api/students/{id}/     -> retrieve
    PUT    /api/students/{id}/     -> full update
    PATCH  /api/students/{id}/     -> partial update
    DELETE /api/students/{id}/     -> delete
    """

    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        course = self.request.query_params.get("course")

        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
            )
        if course:
            qs = qs.filter(course__iexact=course)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"detail": "Student deleted successfully."},
            status=status.HTTP_200_OK,
        )
