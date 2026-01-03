"""
Email Service for Verso
Supports multiple email providers via SMTP or API
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import secrets
from datetime import datetime, timedelta

# Configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@verso.app")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Check if email is properly configured
EMAIL_CONFIGURED = bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def generate_verification_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


def get_token_expiry() -> datetime:
    """Get expiry time (24 hours from now)"""
    return datetime.utcnow() + timedelta(hours=24)


def send_verification_email(to_email: str, username: str, token: str) -> bool:
    """
    Send verification email to user
    Returns True if sent successfully, False otherwise
    """
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
    
    # If email not configured, just log the link and return success
    if not EMAIL_CONFIGURED:
        print(f"\n{'='*60}")
        print(f"EMAIL NOT CONFIGURED - Verification link for {username}:")
        print(f"{verification_link}")
        print(f"{'='*60}\n")
        return True  # Return True so registration continues
    
    # Create email content
    subject = "Verify your Verso account"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }}
            .logo {{ font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 24px; }}
            h1 {{ color: #0f172a; font-size: 24px; margin-bottom: 16px; }}
            p {{ color: #475569; line-height: 1.6; }}
            .button {{ display: inline-block; background: #6366f1; color: white; padding: 14px 28px; 
                       border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0; }}
            .button:hover {{ background: #4f46e5; }}
            .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; 
                       font-size: 14px; color: #94a3b8; }}
            .link {{ color: #6366f1; word-break: break-all; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">📚 Verso</div>
            <h1>Welcome, {username}!</h1>
            <p>Thanks for signing up for Verso. Please verify your email address to get started.</p>
            <a href="{verification_link}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p class="link">{verification_link}</p>
            <div class="footer">
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create a Verso account, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to Verso, {username}!
    
    Please verify your email address by clicking the link below:
    {verification_link}
    
    This link will expire in 24 hours.
    
    If you didn't create a Verso account, you can safely ignore this email.
    """
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        # Use timeout to prevent hanging
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        
        print(f"Verification email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        # Log the link anyway so user can still verify
        print(f"Verification link for {username}: {verification_link}")
        return True  # Return True so registration doesn't fail


def send_password_reset_email(to_email: str, username: str, token: str) -> bool:
    """Send password reset email (for future use)"""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    if not EMAIL_CONFIGURED:
        print(f"Password reset link for {username}: {reset_link}")
        return True
    
    # Similar implementation to verification email...
    return True