from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.db import models


class Student(models.Model):
    """Core entity for the Student Management System (SOP section 7.3)."""

    COURSE_CHOICES = [
        ("CSE", "Computer Science Engineering"),
        ("ECE", "Electronics & Communication Engineering"),
        ("MECH", "Mechanical Engineering"),
        ("CIVIL", "Civil Engineering"),
        ("IT", "Information Technology"),
        ("MBA", "Master of Business Administration"),
    ]

    phone_validator = RegexValidator(
        regex=r"^\+?\d{7,15}$",
        message="Phone number must be 7-15 digits, optionally starting with +.",
    )

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    age = models.PositiveIntegerField(
        validators=[MinValueValidator(15), MaxValueValidator(100)]
    )
    course = models.CharField(max_length=10, choices=COURSE_CHOICES)
    phone = models.CharField(
        max_length=16, blank=True, validators=[phone_validator]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.course})"
