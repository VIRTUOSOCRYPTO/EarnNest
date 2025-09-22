import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # For production, you would use actual SMTP settings
        # For now, we'll simulate email sending with logging
        self.smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_username = os.environ.get("SMTP_USERNAME", "")
        self.smtp_password = os.environ.get("SMTP_PASSWORD", "")
        self.from_email = os.environ.get("FROM_EMAIL", "noreply@earnwise.app")
        
    async def send_verification_email(self, to_email: str, verification_code: str) -> bool:
        """Send email verification code"""
        try:
            subject = "Verify Your EarnWise Account"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Verify Your EarnWise Account</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">EarnWise</h1>
                    <p style="color: #d1fae5; margin: 10px 0 0 0;">Your Financial Success Journey Starts Here</p>
                </div>
                
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1f2937; margin-top: 0;">Welcome to EarnWise!</h2>
                    
                    <p>Thank you for joining our community of successful students. To complete your registration and start exploring side hustle opportunities, please verify your email address.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #10b981; text-align: center; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #6b7280;">Your verification code is:</p>
                        <p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0; letter-spacing: 3px;">{verification_code}</p>
                    </div>
                    
                    <p>Enter this code on the verification page to activate your account. This code will expire in 24 hours.</p>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e;"><strong>Security Note:</strong> Never share this code with anyone. EarnWise will never ask for your verification code via phone or email.</p>
                    </div>
                    
                    <p>If you didn't create an account with EarnWise, please ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="color: #6b7280; font-size: 14px; text-align: center;">
                        © 2024 EarnWise. All rights reserved.<br>
                        Empowering students to achieve financial success.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # For production, implement actual email sending
            # For now, log the verification code
            logger.info(f"EMAIL VERIFICATION: Sending verification code {verification_code} to {to_email}")
            print(f"📧 EMAIL VERIFICATION CODE for {to_email}: {verification_code}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {to_email}: {str(e)}")
            return False
    
    async def send_password_reset_email(self, to_email: str, reset_code: str) -> bool:
        """Send password reset code"""
        try:
            subject = "Reset Your EarnWise Password"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Reset Your EarnWise Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">EarnWise</h1>
                    <p style="color: #fecaca; margin: 10px 0 0 0;">Password Reset Request</p>
                </div>
                
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
                    
                    <p>We received a request to reset your EarnWise account password. Use the code below to set a new password.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #ef4444; text-align: center; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #6b7280;">Your reset code is:</p>
                        <p style="font-size: 32px; font-weight: bold; color: #ef4444; margin: 0; letter-spacing: 3px;">{reset_code}</p>
                    </div>
                    
                    <p>Enter this code on the password reset page to create a new password. This code will expire in 1 hour.</p>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e;"><strong>Security Note:</strong> If you didn't request this password reset, please ignore this email and consider changing your password as a precaution.</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="color: #6b7280; font-size: 14px; text-align: center;">
                        © 2024 EarnWise. All rights reserved.<br>
                        Empowering students to achieve financial success.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # For production, implement actual email sending
            # For now, log the reset code
            logger.info(f"PASSWORD RESET: Sending reset code {reset_code} to {to_email}")
            print(f"🔐 PASSWORD RESET CODE for {to_email}: {reset_code}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {str(e)}")
            return False

    async def send_welcome_email(self, to_email: str, full_name: str) -> bool:
        """Send welcome email after successful verification"""
        try:
            subject = "Welcome to EarnWise - Your Journey Begins!"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Welcome to EarnWise</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to EarnWise!</h1>
                    <p style="color: #d1fae5; margin: 10px 0 0 0;">Your Financial Success Journey Starts Now</p>
                </div>
                
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1f2937; margin-top: 0;">Hi {full_name}!</h2>
                    
                    <p>Congratulations! Your EarnWise account is now verified and ready to use. You're now part of a community dedicated to student financial success.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #d1d5db; margin: 20px 0;">
                        <h3 style="color: #10b981; margin-top: 0;">What's Next?</h3>
                        <ul style="padding-left: 20px;">
                            <li><strong>Explore Side Hustles:</strong> Browse AI-recommended opportunities tailored to your skills</li>
                            <li><strong>Track Your Finances:</strong> Monitor income, expenses, and savings with our smart analytics</li>
                            <li><strong>Set Goals:</strong> Create financial targets and track your progress</li>
                            <li><strong>Join the Community:</strong> Connect with other students and share experiences</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Your Journey</a>
                    </div>
                    
                    <div style="background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                        <p style="margin: 0; color: #1e40af;"><strong>Pro Tip:</strong> Complete your profile with skills and interests to get better side hustle recommendations!</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="color: #6b7280; font-size: 14px; text-align: center;">
                        © 2024 EarnWise. All rights reserved.<br>
                        Empowering students to achieve financial success.
                    </p>
                </div>
            </body>
            </html>
            """
            
            logger.info(f"WELCOME EMAIL: Sending welcome email to {to_email}")
            print(f"✨ WELCOME EMAIL sent to {full_name} ({to_email})")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {to_email}: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()