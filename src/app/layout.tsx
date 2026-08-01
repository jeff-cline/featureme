import type { Metadata } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: "FeatureMe — Get featured across the web",
    template: "%s · FeatureMe",
  },
  description:
    "FeatureMe gets executives, founders, and entrepreneurs featured across digital platforms to earn citations, authority, and answer-engine visibility.",
  openGraph: { siteName: "FeatureMe", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-neutral-900">{children}</body>
    </html>
  );
}
