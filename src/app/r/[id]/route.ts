import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Click-tracking redirect: /r/{pressLinkId} logs the click then 302s to the target.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const link = await prisma.pressLink.findUnique({ where: { id } });
  if (!link) return NextResponse.redirect(new URL("/", req.url));

  await prisma.clickEvent
    .create({
      data: {
        profileId: link.profileId,
        kind: "outbound",
        targetUrl: link.url,
        ref: req.headers.get("referer") ?? undefined,
        ua: req.headers.get("user-agent") ?? undefined,
      },
    })
    .catch(() => {});

  return NextResponse.redirect(link.url);
}
