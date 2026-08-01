// Centralized, typed access to environment variables.
export const env = {
  APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  APP_NAME: process.env.APP_NAME ?? "FeatureMe",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "jeffcline@me.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "TEMP!234",

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ?? "",

  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? "console",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "FeatureMe <no-reply@featureme.io>",
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: process.env.SMTP_PORT ?? "587",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  ZEPTOMAIL_TOKEN: process.env.ZEPTOMAIL_TOKEN ?? "",
};

export const stripeEnabled = () => Boolean(env.STRIPE_SECRET_KEY);
