import smtplib

def send_email(message):

    server = smtplib.SMTP("smtp.gmail.com",587)

    server.starttls()

    server.login("yourmail@gmail.com","app_password")

    server.sendmail(
        "yourmail@gmail.com",
        "user@gmail.com",
        message
    )