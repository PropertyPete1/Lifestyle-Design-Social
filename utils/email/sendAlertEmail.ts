import nodemailer from 'nodemailer';

const user = process.env.ALERT_EMAIL_USER!;
const pass = process.env.ALERT_EMAIL_PASS!;

export async function sendAlertEmail(subject: string, text: string) {
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
} 