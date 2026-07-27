"""Skills app — models."""
import uuid
from django.db import models


class Skill(models.Model):
    """Mirrors skill.js — skills table."""
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'skills'

    def __str__(self):
        return self.name
