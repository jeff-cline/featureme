import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/oauth/blogger";
import { env } from "@/lib/env";

// Kick off Blogger OAuth. State carries the member id so the callback can attach.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(`${env.APP_URL}/login`);
  const url = await buildAuthUrl(user.id);
  if (!url) return NextResponse.redirect(`${env.APP_URL}/connections?err=blogger_not_configured`);
  return NextResponse.redirect(url);
}
