import smtplib
import os
import logging
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")

SMTP_TIMEOUT = 10  # seconds


def send_email_alert(subject: str, message: str, receiver: str) -> bool:
    """Send a single email. Returns True on success, False on failure."""
    try:
        full_message = f"Subject: {subject}\n\n{message}"
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=SMTP_TIMEOUT) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, receiver, full_message)
        return True
    except Exception as e:
        logging.warning(f"Email failed for {receiver}: {e}")
        return False


def send_email_bulk(subject: str, message: str, receivers: list) -> int:
    """
    Send the same email to multiple recipients using a single SMTP session.
    Much more efficient than calling send_email_alert() in a loop.
    Returns the count of successfully sent emails.
    """
    if not receivers:
        return 0

    full_message = f"Subject: {subject}\n\n{message}"
    sent_count = 0

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=SMTP_TIMEOUT) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            for receiver in receivers:
                try:
                    server.sendmail(EMAIL_USER, receiver, full_message)
                    sent_count += 1
                except Exception as e:
                    logging.warning(f"Email failed for {receiver}: {e}")
    except Exception as e:
        logging.error(f"SMTP connection failed: {e}")

    return sent_count