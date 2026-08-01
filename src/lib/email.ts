import "server-only";
import nodemailer from "nodemailer";
import { getIntegrationConfig } from "./integrations";
import { nextMailbox } from "./zapmail";
import { env } from "./env";

export type Mail = { to: string; subject: string; html: string; text?: string };

// Build a transport for the first configured provider:
//   1) ZapMail — rotate across API-provisioned mailboxes (best deliverability)
//   2) generic SMTP integration
//   3) console (logs, so nothing is lost before keys are dropped in)
async function getTransport(): Promise<{ from: string; transport: nodemailer.Transporter } | null> {
  // ZapMail rotation
  const mb = await nextMailbox().catch(() => null);
  if (mb) {
    return {
      from: mb.smtpUser,
      transport: nodemailer.createTransport({
        host: mb.smtpHost, port: mb.smtpPort, secure: mb.smtpPort === 465,
        auth: { user: mb.smtpUser, pass: mb.smtpPass },
      }),
    };
  }

  // Generic SMTP integration
  const c = await getIntegrationConfig("smtp");
  if (c.smtpHost && c.smtpUser && c.smtpPass) {
    const port = parseInt(c.smtpPort || "587", 10);
    return {
      from: c.fromEmail || c.smtpUser,
      transport: nodemailer.createTransport({
        host: c.smtpHost, port, secure: port === 465,
        auth: { user: c.smtpUser, pass: c.smtpPass },
      }),
    };
  }
  return null;
}

export async function sendEmail(mail: Mail): Promise<{ ok: boolean; info?: string }> {
  const t = await getTransport();
  if (!t) {
    console.log(`[email:console] to=${mail.to} subject="${mail.subject}" (no provider configured)`);
    return { ok: true, info: "console" };
  }
  try {
    const info = await t.transport.sendMail({ from: env.EMAIL_FROM || t.from, ...mail });
    return { ok: true, info: info?.messageId || "sent" };
  } catch (e) {
    return { ok: false, info: e instanceof Error ? e.message : "send failed" };
  }
}
