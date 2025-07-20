import nodemailer from 'nodemailer';
import * as Sentry from '@sentry/node';

const user = process.env.ALERT_EMAIL_USER!;
const pass = process.env.ALERT_EMAIL_PASS!;

export async function sendAlertEmail(subject: string, text: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: `"AutoPost Alerts" <${user}>`,
      to: user,
      subject,
      text,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'sendAlertEmail' },
      extra: { subject, text, user }
    });
    throw err; // Re-throw to let caller handle
  }
} 