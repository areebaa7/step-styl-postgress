import nodemailer from 'nodemailer';
import { logError, logInfo } from './logger';

export { buildPromoEmail } from './emailTemplate.mjs';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || `IPL Store <${smtpUser}>`;
const emailDeliveryEnabled = process.env.EMAIL_DELIVERY_ENABLED === 'true';

const transporter =
  emailDeliveryEnabled && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 5_000,
        greetingTimeout: 5_000,
        socketTimeout: 10_000,
      })
    : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export function getEmailDeliveryStatus() {
  const missing = [
    ...(!emailDeliveryEnabled ? ['EMAIL_DELIVERY_ENABLED=true'] : []),
    ...(!smtpUser ? ['SMTP_USER'] : []),
    ...(!smtpPass ? ['SMTP_PASS'] : []),
  ];
  return {
    mode: transporter ? 'SMTP' as const : 'PROVIDERLESS' as const,
    configured: Boolean(transporter),
    deliveryEnabled: emailDeliveryEnabled,
    missing,
  };
}

export async function verifyEmailConfiguration() {
  if (!transporter) return getEmailDeliveryStatus();
  await transporter.verify();
  return getEmailDeliveryStatus();
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!transporter) {
    logInfo('email.delivery_skipped', { reason: 'provider_not_configured', channel: 'single' });
    return false;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
  });
  return true;
}

interface SendBulkEmailOptions {
  bcc: string[];
  subject: string;
  html: string;
}

export async function sendBulkEmail({ bcc, subject, html }: SendBulkEmailOptions) {
  if (!transporter) {
    logInfo('email.delivery_skipped', { reason: 'provider_not_configured', channel: 'bulk', recipientCount: bcc.length });
    return;
  }

  // Send in batches of 50 to avoid SMTP limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < bcc.length; i += BATCH_SIZE) {
    const batch = bcc.slice(i, i + BATCH_SIZE);
    try {
      await transporter.sendMail({
        from: smtpFrom,
        bcc: batch,
        subject,
        html,
      });
      logInfo('email.bulk_batch_sent', { batch: i / BATCH_SIZE + 1, recipientCount: batch.length });
    } catch (error) {
      logError('email.bulk_batch_failed', { batch: i / BATCH_SIZE + 1, recipientCount: batch.length, error });
    }
  }
}

interface MarketingRecipient {
  email: string;
  unsubscribeToken: string;
}

export async function sendMarketingEmails({
  recipients,
  subject,
  html,
}: {
  recipients: MarketingRecipient[];
  subject: string;
  html: string;
}) {
  if (!transporter) {
    logInfo('email.delivery_skipped', { reason: 'provider_not_configured', channel: 'marketing', recipientCount: recipients.length });
    return;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000')).replace(/\/$/, '');
  for (let index = 0; index < recipients.length; index += 10) {
    const batch = recipients.slice(index, index + 10);
    await Promise.allSettled(batch.map((recipient) => {
      const unsubscribeUrl = `${appUrl}/unsubscribe?token=${encodeURIComponent(recipient.unsubscribeToken)}`;
      const personalizedHtml = `${html}
        <p style="margin-top:24px;font-size:12px;color:#777;text-align:center">
          You opted in to Step & Styl marketing emails.
          <a href="${unsubscribeUrl}" style="color:#6B21A8">Unsubscribe</a>
        </p>`;
      return transporter.sendMail({ from: smtpFrom, to: recipient.email, subject, html: personalizedHtml });
    }));
  }
}

export async function sendPaymentProofReceivedEmail(to: string, orderId: string) {
  const subject = 'Payment Proof Received - Step & Styl';
  const html = `<div style="font-family: Arial, sans-serif;">
      <h2>Payment Proof Received</h2>
      <p>Thanks for choosing Step & Styl. Your payment proof for Order #${orderId} has been received.</p>
      <p>Your order will be confirmed and processed soon after verification.</p>
    </div>`;
  return sendEmail({ to, subject, html });
}

export async function sendPaymentVerifiedEmail(to: string, orderId: string) {
  const subject = 'Payment Verified - Step & Styl';
  const html = `<div style="font-family: Arial, sans-serif;">
      <h2>Payment Verified</h2>
      <p>Great news! Your payment for Order #${orderId} has been successfully verified.</p>
      <p>We are now processing your order and will update you once it's shipped.</p>
    </div>`;
  return sendEmail({ to, subject, html });
}

export async function sendAffiliateApprovalEmail(to: string, name: string) {
  const subject = 'Welcome to the Step & Styl Creator Program!';
  const html = `<div style="font-family: Arial, sans-serif;">
      <h2>Congratulations, ${name}!</h2>
      <p>Your application to the Step & Styl Creator Program has been approved.</p>
      <p>You can now log in to your dashboard to view your tracking links, promo codes, and commissions.</p>
    </div>`;
  return sendEmail({ to, subject, html });
}

export async function sendAffiliateRejectionEmail(to: string, name: string) {
  const subject = 'Step & Styl Creator Program Application Update';
  const html = `<div style="font-family: Arial, sans-serif;">
      <h2>Hi ${name},</h2>
      <p>Thank you for applying to the Step & Styl Creator Program.</p>
      <p>After careful consideration, we are unable to approve your application at this time.</p>
    </div>`;
  return sendEmail({ to, subject, html });
}

export async function sendAffiliateApplicationReceivedEmail(to: string, name: string) {
  const subject = 'Application Received - Step & Styl Creator Program';
  const html = `<div style="font-family: Arial, sans-serif;">
      <h2>Hi ${name},</h2>
      <p>Thank you for applying to the Step & Styl Creator Program!</p>
      <p>We have successfully received your application. Our team will review your channel(s) and get back to you within 24-48 hours.</p>
    </div>`;
  return sendEmail({ to, subject, html });
}

export async function sendOrderApprovedEmail(to: string, name: string, orderId: string) {
  const subject = 'Order Approved - Step & Styl';
  const html = `<div style="font-family: Arial, sans-serif;">
      <h2>Hi ${name || 'Customer'},</h2>
      <p>Great news! Your order <strong>#${orderId}</strong> has been approved and is now being processed.</p>
      <p>Your items will be packed and dispatched shortly. You can expect delivery within 3 to 5 working days.</p>
      <p>Thank you for shopping with Step & Styl!</p>
    </div>`;
  return sendEmail({ to, subject, html });
}

export async function sendOrderRejectedEmail(to: string, name: string, orderId: string) {
  const subject = 'Order Update - Step & Styl';
  const html = `<div style="font-family: Arial, sans-serif;">
      <h2>Hi ${name || 'Customer'},</h2>
      <p>We are writing to inform you that your order <strong>#${orderId}</strong> has been cancelled or rejected.</p>
      <p>If you believe this was an error, or if you need assistance, please contact our support team.</p>
    </div>`;
  return sendEmail({ to, subject, html });
}

export async function sendOrderDeliveredEmail(to: string, name: string, orderId: string) {
  const subject = 'Your Step & Styl Order Has Been Delivered! 🎉';
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1F2937;">
      <h2 style="color: #9b4de0;">Delivered with Love!</h2>
      <p>Hi ${name || 'Customer'},</p>
      <p>Your order <strong>#${orderId}</strong> has been marked as delivered.</p>
      <p>We hope you love your new footwear! If you enjoy your purchase, please take a moment to leave a review and share your style with us.</p>
      <p style="margin-top: 24px;">Thank you for choosing Step & Styl!</p>
    </div>`;
  return sendEmail({ to, subject, html });
}
