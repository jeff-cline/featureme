import "server-only";
import { env } from "./env";

export type Mail = { to: string; subject: string; html: string; text?: string };

// Pluggable email sender. Defaults to "console" so the app runs with zero setup;
// swap EMAIL_PROVIDER to "smtp" or "zeptomail" (ZeptoMail / "Zapmail") once keys exist.
export async function sendEmail(mail: Mail): Promise<{ ok: boolean; info?: string }> {
  const provider = env.EMAIL_PROVIDER;

  if (provider === "zeptomail" && env.ZEPTOMAIL_TOKEN) {
    try {
      const res = await fetch("https://api.zeptomail.com/v1.1/email", {
        method: "POST",
        headers: {
          Authorization: env.ZEPTOMAIL_TOKEN, // e.g. "Zoho-enczapikey xxxx"
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: { address: extractAddress(env.EMAIL_FROM) },
          to: [{ email_address: { address: mail.to } }],
          subject: mail.subject,
          htmlbody: mail.html,
        }),
      });
      return { ok: res.ok, info: `zeptomail ${res.status}` };
    } catch (e) {
      return { ok: false, info: String(e) };
    }
  }

  if (provider === "smtp" && env.SMTP_HOST) {
    // Lazy import so nodemailer is only needed when SMTP is actually configured.
    try {
      // Non-static specifier so the bundler doesn't try to resolve this optional dep.
      const mod = "nodemailer";
      const nodemailer = (await import(/* webpackIgnore: true */ mod)).default;
      const transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT),
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      });
      await transport.sendMail({ from: env.EMAIL_FROM, ...mail });
      return { ok: true, info: "smtp sent" };
    } catch (e) {
      return { ok: false, info: String(e) };
    }
  }

  // Fallback: log to server console so nothing is silently lost in dev.
  console.log(`[email:console] to=${mail.to} subject="${mail.subject}"`);
  return { ok: true, info: "console" };
}

function extractAddress(from: string) {
  const m = from.match(/<([^>]+)>/);
  return m ? m[1] : from;
}
