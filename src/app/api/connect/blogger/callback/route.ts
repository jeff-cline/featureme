import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { exchangeCode, listBlogs } from "@/lib/oauth/blogger";

// Google redirects here with ?code & ?state (=userId). Exchange, store token +
// the first blog id, and mark the connection connected.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const userId = req.nextUrl.searchParams.get("state");
  if (!code || !userId) return NextResponse.redirect(`${env.APP_URL}/connections?err=blogger_oauth`);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.redirect(`${env.APP_URL}/connections?err=blogger_user`);

  const tok = await exchangeCode(code);
  if (!tok.accessToken) return NextResponse.redirect(`${env.APP_URL}/connections?err=blogger_token`);

  const blogs = await listBlogs(tok.accessToken);
  const meta = { blogId: blogs[0]?.id ?? "", blogName: blogs[0]?.name ?? "" };

  await prisma.connection.upsert({
    where: { userId_targetKey: { userId, targetKey: "blogger" } },
    update: { status: "connected", accessToken: tok.accessToken, refreshToken: tok.refreshToken ?? null, meta: JSON.stringify(meta) },
    create: {
      userId, targetKey: "blogger", status: "connected",
      accessToken: tok.accessToken, refreshToken: tok.refreshToken ?? null, meta: JSON.stringify(meta),
    },
  });

  return NextResponse.redirect(`${env.APP_URL}/connections?ok=blogger`);
}
