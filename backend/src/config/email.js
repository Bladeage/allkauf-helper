import nodemailer from 'nodemailer';
import { config } from './env.js';

// ProtonMail-SMTP: smtp.protonmail.ch:587, STARTTLS (secure:false)
export const transporter = nodemailer.createTransport({
  host: config.smtp.server,
  port: config.smtp.port,
  secure: false, // STARTTLS auf Port 587
  auth: {
    user: config.smtp.user,
    pass: config.smtp.password, // Proton SMTP-Token
  },
});

export function smtpConfigured() {
  return Boolean(config.smtp.user && config.smtp.password && config.mailTo.length > 0);
}
