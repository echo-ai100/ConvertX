import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from "./env";

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function sendVerificationCode(
  email: string,
  code: string,
  locale: string,
): Promise<boolean> {
  if (!transporter) {
    console.warn("SMTP not configured, skipping email send. Code:", code);
    return true;
  }

  const subject =
    locale === "zh-CN" ? "ConvertX 邮箱验证码" : "ConvertX Verification Code";
  const body =
    locale === "zh-CN"
      ? `<p>您的验证码是：<strong style="font-size:24px;letter-spacing:4px">${code}</strong></p><p>验证码5分钟内有效，请勿泄露。</p>`
      : `<p>Your verification code is: <strong style="font-size:24px;letter-spacing:4px">${code}</strong></p><p>This code expires in 5 minutes. Do not share it.</p>`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html: body,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}