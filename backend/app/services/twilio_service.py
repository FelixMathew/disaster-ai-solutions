import os
import logging
from dotenv import load_dotenv

load_dotenv()

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
WHATSAPP_TO = os.getenv("TWILIO_WHATSAPP_TO", "")
CONTENT_SID = os.getenv("TWILIO_CONTENT_SID", "HXb5b62575e6e4ff6129ad7c8efe1f983e")


def send_whatsapp_sos(to_number: str = None) -> bool:
    """
    Send a WhatsApp 'Be Safe' message via Twilio sandbox.
    Uses the fixed ContentSid template. Returns True on success.
    """
    if not ACCOUNT_SID or not AUTH_TOKEN:
        logging.warning("Twilio credentials not configured.")
        return False

    target = to_number or WHATSAPP_TO
    if not target:
        logging.warning("No WhatsApp target number configured.")
        return False

    # Ensure whatsapp: prefix
    if not target.startswith("whatsapp:"):
        target = f"whatsapp:{target}"

    try:
        from twilio.rest import Client
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        message = client.messages.create(
            from_=WHATSAPP_FROM,
            content_sid=CONTENT_SID,
            content_variables='{"1":"12/1","2":"3pm"}',
            to=target,
        )
        logging.info(f"Twilio WhatsApp sent: {message.sid} to {target}")
        return True
    except Exception as e:
        logging.error(f"Twilio WhatsApp failed for {target}: {e}")
        return False


def send_whatsapp_to_contacts(contacts: list) -> int:
    """
    Send WhatsApp SOS to a list of contact numbers.
    Returns count of successful sends.
    """
    count = 0
    for number in contacts:
        if send_whatsapp_sos(number):
            count += 1
    return count
