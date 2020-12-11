"""email stage tasks"""
from email.utils import make_msgid
from smtplib import SMTPException
from typing import Any, Dict, List

from celery import group
from django.core.mail import EmailMultiAlternatives
from django.core.mail.utils import DNS_NAME
from structlog import get_logger

from authentik.lib.tasks import MonitoredTask, TaskResult, TaskResultStatus
from authentik.root.celery import CELERY_APP
from authentik.stages.email.models import EmailStage

LOGGER = get_logger()


def send_mails(stage: EmailStage, *messages: List[EmailMultiAlternatives]):
    """Wrapper to convert EmailMessage to dict and send it from worker"""
    tasks = []
    for message in messages:
        tasks.append(send_mail.s(stage.pk, message.__dict__))
    lazy_group = group(*tasks)
    promise = lazy_group()
    return promise


@CELERY_APP.task(
    bind=True,
    autoretry_for=(
        SMTPException,
        ConnectionError,
    ),
    retry_backoff=True,
    base=MonitoredTask,
)
def send_mail(self: MonitoredTask, email_stage_pk: int, message: Dict[Any, Any]):
    """Send Email for Email Stage. Retries are scheduled automatically."""
    self.save_on_success = False
    message_id = make_msgid(domain=DNS_NAME)
    self.set_uid(message_id)
    try:
        stage: EmailStage = EmailStage.objects.get(pk=email_stage_pk)
        backend = stage.backend
        backend.open()
        # Since django's EmailMessage objects are not JSON serialisable,
        # we need to rebuild them from a dict
        message_object = EmailMultiAlternatives()
        for key, value in message.items():
            setattr(message_object, key, value)
        message_object.from_email = stage.from_address
        # Because we use the Message-ID as UID for the task, manually assign it
        message_object.extra_headers["Message-ID"] = message_id

        LOGGER.debug("Sending mail", to=message_object.to)
        stage.backend.send_messages([message_object])
        self.set_status(
            TaskResult(
                TaskResultStatus.SUCCESSFUL,
                messages=["Successfully sent Mail."],
            )
        )
    except (SMTPException, ConnectionError) as exc:
        self.set_status(TaskResult(TaskResultStatus.ERROR).with_error(exc))
        raise exc