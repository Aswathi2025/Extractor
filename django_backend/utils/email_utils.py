"""
Email utility — Python port of sendEmail.js (nodemailer + EJS → Django + HTML templates).
"""
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, template: str, context: dict = None):
    """
    Send an HTML email using a Django template.

    :param to: Recipient email address
    :param subject: Email subject line
    :param template: Template name inside templates/emails/ (e.g. 'verify_email.html')
    :param context: Template context variables
    """
    context = context or {}
    to_email = to.strip() if isinstance(to, str) else str(to)
    
    html_content = render_to_string(f'emails/{template}', context)
    
    # Construct meaningful plain-text content to improve email deliverability
    name = context.get('name', 'Candidate')
    job_title = context.get('job_title', 'the applied position')
    dashboard_url = context.get('dashboard_url', f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/tests")
    
    if 'aptitude' in template:
        text_content = f"Hello {name},\n\nYour application for {job_title} at Abc company has moved to the Aptitude Round.\nPlease complete your assessment test on your candidate dashboard: {dashboard_url}\n\nThank you,\nExtractor Team"
    elif 'technical' in template:
        text_content = f"Hello {name},\n\nYou have moved to the Technical Round for {job_title} at Abc company.\nPlease submit your technical test on your candidate dashboard: {dashboard_url}\n\nThank you,\nExtractor Team"
    elif 'face_to_face' in template:
        date_str = context.get('interview_date', 'To be communicated')
        time_str = context.get('interview_time', 'To be communicated')
        loc_str = context.get('interview_location', 'Abc company chennai')
        text_content = f"Hello {name},\n\nYou are invited for a Face-to-Face Interview for {job_title}.\nDate: {date_str}\nTime: {time_str}\nLocation: {loc_str}\n\nThank you,\nExtractor Team"
    elif 'selected' in template:
        text_content = f"Congratulations {name}!\n\nYour application for {job_title} at Abc company has been accepted! Our HR team will reach out with next steps.\n\nBest regards,\nExtractor Team"
    elif 'verify_email' in template or 'otp' in context:
        otp = context.get('otp', '')
        text_content = f"Hello {name},\n\nYour verification code is: {otp}\nIt will expire in 5 minutes.\n\nThank you,\nExtractor Team"
    else:
        text_content = f"Hello {name},\n\nPlease log into your Extractor portal to view details regarding {job_title}.\n\nThank you,\nExtractor Team"

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    msg.attach_alternative(html_content, 'text/html')
    msg.send()
    logger.info(f'Email sent to {to_email}: {subject}')
