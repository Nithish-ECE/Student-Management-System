from rest_framework import serializers

from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            "id",
            "name",
            "email",
            "age",
            "course",
            "phone",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()

    def validate_email(self, value):
        # Ensure uniqueness is checked on update as well as create.
        qs = Student.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A student with this email already exists.")
        return value.lower()

    def validate_age(self, value):
        if value < 15 or value > 100:
            raise serializers.ValidationError("Age must be between 15 and 100.")
        return value
