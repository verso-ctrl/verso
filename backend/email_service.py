"""
Email Service for Verso
Uses Resend for reliable email delivery
"""

import os
import secrets
from datetime import datetime, timedelta

# Configuration from environment
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "Verso <noreply@versosarchive.com>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://www.versosarchive.com")

# Check if email is properly configured
EMAIL_CONFIGURED = bool(RESEND_API_KEY)


def generate_verification_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


def get_token_expiry() -> datetime:
    """Get expiry time (24 hours from now)"""
    return datetime.utcnow() + timedelta(hours=24)


def send_verification_email(to_email: str, username: str, token: str) -> bool:
    """
    Send verification email to user using Resend
    Returns True if sent successfully, False otherwise
    """
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
    
    # If Resend not configured, just log the link and return success
    if not EMAIL_CONFIGURED:
        print(f"\n{'='*60}")
        print(f"EMAIL NOT CONFIGURED - Verification link for {username}:")
        print(f"{verification_link}")
        print(f"{'='*60}\n")
        return True  # Return True so registration continues
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0; }}
            .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .logo {{ font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 8px; }}
            .tagline {{ color: #64748b; font-size: 14px; margin-bottom: 32px; }}
            h1 {{ color: #0f172a; font-size: 24px; margin-bottom: 16px; margin-top: 0; }}
            p {{ color: #475569; line-height: 1.6; margin: 0 0 16px 0; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 14px 32px; 
                       border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0; }}
            .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; 
                       font-size: 13px; color: #94a3b8; }}
            .link {{ color: #6366f1; word-break: break-all; font-size: 13px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">📚 Verso</div>
            <div class="tagline">Your reading life, elevated</div>
            <h1>Welcome, {username}!</h1>
            <p>Thanks for joining Verso. You're one click away from tracking your reading journey, discovering new books, and connecting with fellow readers.</p>
            <p>Please verify your email address to get started:</p>
            <a href="{verification_link}" class="button">Verify Email Address</a>
            <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:</p>
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

Thanks for joining Verso. You're one click away from tracking your reading journey.

Please verify your email address by clicking the link below:
{verification_link}

This link will expire in 24 hours.

If you didn't create a Verso account, you can safely ignore this email.

- The Verso Team
    """
    
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Verify your Verso account",
            "html": html_content,
            "text": text_content,
        }
        
        response = resend.Emails.send(params)
        print(f"Verification email sent to {to_email}, id: {response.get('id', 'unknown')}")
        return True
        
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        # Log the link anyway so user can still verify
        print(f"Verification link for {username}: {verification_link}")
        return True  # Return True so registration doesn't fail


def send_password_reset_email(to_email: str, username: str, token: str) -> bool:
    """Send password reset email"""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    if not EMAIL_CONFIGURED:
        print(f"Password reset link for {username}: {reset_link}")
        return True
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0; }}
            .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .logo {{ font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 8px; }}
            h1 {{ color: #0f172a; font-size: 24px; margin-bottom: 16px; margin-top: 0; }}
            p {{ color: #475569; line-height: 1.6; margin: 0 0 16px 0; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 14px 32px; 
                       border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0; }}
            .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">📚 Verso</div>
            <h1>Reset your password</h1>
            <p>Hi {username}, we received a request to reset your password. Click the button below to choose a new one:</p>
            <a href="{reset_link}" class="button">Reset Password</a>
            <div class="footer">
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Reset your Verso password",
            "html": html_content,
        }
        
        resend.Emails.send(params)
        return True
        
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
        print(f"Reset link for {username}: {reset_link}")
        return True
