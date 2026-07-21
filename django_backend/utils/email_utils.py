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
    html_content = render_to_string(f'emails/{template}', context)
    text_content = f'Please view this email in an HTML-capable email client.'

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to],
    )
    msg.attach_alternative(html_content, 'text/html')
    msg.send()
    logger.info(f'Email sent to {to}: {subject}')
