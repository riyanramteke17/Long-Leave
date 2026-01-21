
# Leave Management System - Backend Architecture (Django)

To build this in production using Django, follow this structure:

## 1. Custom User Model
```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('WARDEN', 'First Checker'),
        ('CHECKER', 'Second Checker'),
        ('ADMIN', 'Final Approver'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    phone = models.CharField(max_length=15, blank=True)
```

## 2. Leave Model
```python
class LeaveRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING_WARDEN', 'Pending Warden'),
        ('PENDING_CHECKER', 'Pending Checker'),
        ('PENDING_ADMIN', 'Pending Admin'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leaves')
    reason = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_WARDEN')
    document = models.FileField(upload_to='leave_docs/')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_days(self):
        return (self.end_date - self.start_date).days + 1
```

## 3. Automation (Celery Task)
```python
# tasks.py
from celery import shared_task
from datetime import date, timedelta
from .models import LeaveRequest
from django.core.mail import send_mail

@shared_task
def send_leave_reminders():
    tomorrow = date.today() + timedelta(days=1)
    expiring_leaves = LeaveRequest.objects.filter(end_date=tomorrow, status='APPROVED')
    
    for leave in expiring_leaves:
        send_mail(
            'Reminder: Your Leave Ends Tomorrow',
            f'Hi {leave.student.username}, please return to campus by {leave.end_date}.',
            'system@hostel.edu',
            [leave.student.email],
        )
```

## 4. Email Utility
```python
def notify_status_change(leave):
    subject = f"Leave Status Update: {leave.get_status_display()}"
    # Logic to send to student and relevant checkers
    # ...
```
