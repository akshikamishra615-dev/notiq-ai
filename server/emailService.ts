import { logger } from './logger';

export interface SendOtpEmailParams {
  toEmail: string;
  userName?: string;
  otpCode: string;
  type: 'verify' | 'forgot';
}

/**
 * Mask recipient email for safe logging (e.g. akshika@gmail.com -> ak****@gmail.com)
 */
export function maskEmailForLogs(email: string): string {
  if (!email || !email.includes('@')) return 'masked@email';
  const [name, domain] = email.trim().toLowerCase().split('@');
  if (name.length <= 2) return `${name}****@${domain}`;
  return `${name.slice(0, 2)}****@${domain}`;
}

/**
 * Render clean NOTIQ AI transactional OTP email HTML and Plain Text
 */
export function renderOtpEmailContent(params: {
  userName?: string;
  otpCode: string;
  type: 'verify' | 'forgot';
}): { subject: string; text: string; html: string } {
  const { userName, otpCode, type } = params;
  const name = userName ? userName.trim() : 'Scholar';

  if (type === 'forgot') {
    const subject = 'NOTIQ AI — Password Reset Verification Code';
    const text = `Hello ${name},\n\nWe received a request to reset your NOTIQ AI account password.\n\nYour verification code is: ${otpCode}\n\nThis code expires in 5 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.\n\nNOTIQ AI Team`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a15; color: #ffffff; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: #141028; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
    .logo-badge { display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #EF4444, #FF6FB5); border-radius: 12px; font-weight: 900; font-size: 18px; color: #ffffff; text-decoration: none; }
    h1 { font-size: 20px; font-weight: 800; text-align: center; margin-top: 20px; color: #ffffff; }
    p { font-size: 13px; color: #cbd5e1; line-height: 1.6; }
    .otp-box { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #EF4444; }
    .expiry { font-size: 11px; color: #f43f5e; margin-top: 8px; font-weight: 700; }
    .footer { text-align: center; margin-top: 28px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center;">
      <div class="logo-badge">NOTIQ AI</div>
    </div>
    <h1>Reset Your Password</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>We received a request to reset your NOTIQ AI account password. Your 6-digit verification code is:</p>
    <div class="otp-box">
      <div class="otp-code">${otpCode}</div>
      <div class="expiry">⏱️ Code expires in exactly 5 minutes</div>
    </div>
    <p style="font-size: 11px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email.</p>
    <div class="footer">
      NOTIQ AI — Ultimate AI Study & Productivity Companion
    </div>
  </div>
</body>
</html>
    `;
    return { subject, text, html };
  }

  const subject = 'NOTIQ AI — Verify Your Email Address';
  const text = `Hello ${name},\n\nWelcome to NOTIQ AI!\n\nYour 6-digit email verification code is: ${otpCode}\n\nThis code expires in 5 minutes.\n\nIf you did not request this verification code, you can safely ignore this email.\n\nNOTIQ AI Team`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a15; color: #ffffff; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: #141028; border: 1px solid rgba(108, 59, 255, 0.4); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
    .logo-badge { display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #6C3BFF, #FF6FB5); border-radius: 12px; font-weight: 900; font-size: 18px; color: #ffffff; text-decoration: none; }
    h1 { font-size: 20px; font-weight: 800; text-align: center; margin-top: 20px; color: #ffffff; }
    p { font-size: 13px; color: #cbd5e1; line-height: 1.6; }
    .otp-box { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(108, 59, 255, 0.4); border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #FF6FB5; }
    .expiry { font-size: 11px; color: #f43f5e; margin-top: 8px; font-weight: 700; }
    .footer { text-align: center; margin-top: 28px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center;">
      <div class="logo-badge">NOTIQ AI</div>
    </div>
    <h1>Verify Your Email Address</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Thank you for registering with NOTIQ AI. To complete your account verification, please enter your 6-digit verification code:</p>
    <div class="otp-box">
      <div class="otp-code">${otpCode}</div>
      <div class="expiry">⏱️ Code expires in exactly 5 minutes</div>
    </div>
    <p style="font-size: 11px; color: #94a3b8;">If you did not request this verification code, you can safely ignore this email.</p>
    <div class="footer">
      NOTIQ AI — Ultimate AI Study & Productivity Companion
    </div>
  </div>
</body>
</html>
  `;
  return { subject, text, html };
}

/**
 * Execute Mailjet Send API v3.1 Request
 */
export async function sendOtpEmailViaMailjet(params: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { toEmail, userName, otpCode, type } = params;

  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const fromEmail = process.env.MAILJET_FROM_EMAIL || 'akshikamishra615@gmail.com';
  const fromName = process.env.MAILJET_FROM_NAME || 'NOTIQ AI';

  const maskedTo = maskEmailForLogs(toEmail);

  if (!apiKey || !secretKey || !fromEmail || apiKey.includes('your_') || secretKey.includes('your_') || fromEmail.includes('your_')) {
    const errorMsg = 'Mailjet API credentials (MAILJET_API_KEY / MAILJET_SECRET_KEY / MAILJET_FROM_EMAIL) are not configured in environment variables.';
    logger.error('email.mailjet_config_missing', errorMsg, undefined, { maskedRecipient: maskedTo });
    return { success: false, error: 'Unable to send verification email. Mailjet email service credentials are not configured on the server.' };
  }

  const emailContent = renderOtpEmailContent({ userName, otpCode, type });

  const mailjetPayload = {
    Messages: [
      {
        From: {
          Email: fromEmail.trim(),
          Name: fromName.trim(),
        },
        To: [
          {
            Email: toEmail.trim(),
            Name: userName ? userName.trim() : 'Scholar',
          },
        ],
        Subject: emailContent.subject,
        TextPart: emailContent.text,
        HTMLPart: emailContent.html,
        CustomID: `notiq-otp-${Date.now()}`,
      },
    ],
  };

  const authHeader = `Basic ${Buffer.from(`${apiKey.trim()}:${secretKey.trim()}`).toString('base64')}`;

  try {
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(mailjetPayload),
    });

    const body: any = await response.json();

    if (!response.ok) {
      const sanitizedStatus = response.status;
      const errorMessage = body?.ErrorMessage || body?.message || `Mailjet HTTP ${response.status}`;
      logger.error('email.mailjet_http_error', 'Mailjet API returned error response', undefined, {
        provider: 'Mailjet',
        maskedRecipient: maskedTo,
        senderDomain: fromEmail.split('@')[1] || '',
        httpStatus: sanitizedStatus,
        error: errorMessage,
      });
      return { success: false, error: 'Unable to send verification email. Please try again.' };
    }

    const messageResult = body?.Messages?.[0];
    const status = messageResult?.Status;
    const messageId = messageResult?.To?.[0]?.MessageID ? String(messageResult.To[0].MessageID) : undefined;

    if (status === 'success') {
      logger.info('email.mailjet_success', 'Mailjet successfully accepted transactional OTP email', undefined, {
        provider: 'Mailjet',
        maskedRecipient: maskedTo,
        senderDomain: fromEmail.split('@')[1] || '',
        httpStatus: response.status,
        mailjetStatus: status,
        messageId,
      });
      return { success: true, messageId };
    }

    const errors = messageResult?.Errors?.map((e: any) => e.ErrorMessage).join('; ') || 'Mailjet message status unsuccessful';
    logger.error('email.mailjet_message_rejected', 'Mailjet rejected email message delivery', undefined, {
      provider: 'Mailjet',
      maskedRecipient: maskedTo,
      httpStatus: response.status,
      mailjetStatus: status,
      errors,
    });
    return { success: false, error: 'Unable to send verification email. Please try again.' };
  } catch (err: any) {
    logger.error('email.network_exception', 'Network exception while connecting to Mailjet Send API', undefined, {
      provider: 'Mailjet',
      maskedRecipient: maskedTo,
      error: err?.message || 'Connection error',
    });
    return { success: false, error: 'Unable to send verification email. Please try again.' };
  }
}
