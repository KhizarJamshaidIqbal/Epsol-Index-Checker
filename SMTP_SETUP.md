# SMTP Email Configuration Guide

## Overview
This application uses email-based authentication (magic links) powered by NextAuth.js and Nodemailer with SSL/TLS encryption.

## SMTP Server Details

**Server:** epsoldev.com  
**Port:** 465 (SSL/TLS)  
**Username:** epsolindexchecker@epsoldev.com  
**Password:** JinnahEnt786

## Setup Instructions

### 1. Update Environment Variables

Copy the values from `.env.example` to your `.env` file:

```bash
# Email provider for magic links (SMTP Configuration)
EMAIL_SERVER_HOST=epsoldev.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=epsolindexchecker@epsoldev.com
EMAIL_SERVER_PASSWORD=JinnahEnt786
EMAIL_FROM=epsolindexchecker@epsoldev.com
```

### 2. Restart Development Server

After updating `.env`, restart your development server:

```bash
npm run dev
```

### 3. Test Email Delivery

1. Go to `http://localhost:3000/auth/signup`
2. Enter your email address
3. Click "Create Account"
4. Check your email inbox for the verification link

## How It Works

### Sign Up Flow
1. User enters email on `/auth/signup`
2. System sends verification email via SMTP
3. User clicks link in email
4. Account is automatically created
5. User is signed in and redirected to `/campaigns`

### Sign In Flow
1. User enters email on `/auth/signin`
2. System sends magic link via SMTP
3. User clicks link in email
4. User is signed in and redirected to `/campaigns`

## Email Template

The system sends beautifully formatted HTML emails with:
- Branded header
- Call-to-action button
- Fallback plain text link
- Security notice

## Security Features

- **SSL/TLS Encryption**: All emails sent over encrypted connection (port 465)
- **JWT Sessions**: Secure session management
- **Magic Links**: No password storage required
- **One-time Links**: Verification tokens expire after use

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials**
   ```bash
   # Verify your .env file has correct values
   cat .env | grep EMAIL
   ```

2. **Check firewall settings**
   - Ensure port 465 is not blocked
   - Verify server allows outbound SMTP connections

3. **Test SMTP connection**
   ```bash
   # Install telnet
   telnet epsoldev.com 465
   ```

### Development Mode

If EMAIL_SERVER_HOST is not set, the system falls back to development mode:
- Magic links are logged to the console
- No actual emails are sent
- Useful for local testing

### Common Errors

- **"Could not send email"**: SMTP server unavailable or credentials incorrect
- **"Email already exists"**: User account already created, use sign in instead
- **"Verification token expired"**: Link is one-time use only, request a new one

## Mail Server Settings Reference

### Incoming Server (IMAP/POP3)
- **Server:** epsoldev.com
- **IMAP Port:** 993 (SSL)
- **POP3 Port:** 995 (SSL)

### Outgoing Server (SMTP)
- **Server:** epsoldev.com
- **SMTP Port:** 465 (SSL/TLS)
- **Authentication:** Required

### Calendar & Contacts
- **Server:** https://epsoldev.com:2080
- **Port:** 2080
- **CalDAV:** https://epsoldev.com:2080/calendars/epsolindexchecker@epsoldev.com/calendar
- **CardDAV:** https://epsoldev.com:2080/addressbooks/epsolindexchecker@epsoldev.com/addressbook

## Production Deployment

When deploying to production:

1. **Update Environment Variables**
   ```bash
   NEXTAUTH_URL=https://your-domain.com
   EMAIL_FROM=epsolindexchecker@epsoldev.com
   ```

2. **Verify DNS Records**
   - Ensure your domain has proper SPF records
   - Configure DKIM if available
   - Set up DMARC policy

3. **Test Email Deliverability**
   - Send test emails to Gmail, Outlook, etc.
   - Check spam folders
   - Verify sender reputation

## Support

For issues with:
- **SMTP server**: Contact your hosting provider (epsoldev.com)
- **Application code**: Check console logs and error messages
- **Email delivery**: Verify recipient's spam folder

---

**Last Updated:** October 25, 2025
