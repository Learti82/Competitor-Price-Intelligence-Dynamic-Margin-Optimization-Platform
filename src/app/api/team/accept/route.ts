import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { token }: { token: string } = body;
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const invite = await db.teamInvite.findUnique({ where: { token } });
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.accepted)
      return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
    if (invite.expiresAt < new Date())
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });

    const user = await currentUser();
    const displayName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "Team Member";
    const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? invite.email;

    // Idempotency: check existing membership
    const existing = await db.companyUser.findFirst({
      where: { clerkUserId: userId, companyId: invite.companyId },
    });

    if (!existing) {
      await db.companyUser.create({
        data: {
          clerkUserId: userId,
          companyId: invite.companyId,
          role: invite.role,
          name: displayName,
          email: userEmail,
        },
      });
    }

    await db.teamInvite.update({
      where: { id: invite.id },
      data: { accepted: true },
    });

    await db.auditLog.create({
      data: {
        companyId: invite.companyId,
        userId,
        userName: displayName,
        action: "INVITE_ACCEPTED",
        entityType: "TeamInvite",
        entityId: invite.id,
        newValue: { role: invite.role, email: invite.email },
      },
    });

    return NextResponse.json({ success: true, companyId: invite.companyId });
  } catch (err) {
    console.error("Team accept error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
