import secrets
import string

def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP of specified length (default 6 digits)."""
    digits = string.digits
    return ''.join(secrets.choice(digits) for _ in range(length))
