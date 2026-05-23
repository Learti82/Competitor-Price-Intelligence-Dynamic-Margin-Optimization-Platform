import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

export async function GET(_req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [members, invites] = await Promise.all([
      db.companyUser.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "asc" },
      }),
      db.teamInvite.findMany({
        where: { companyId: company.id, accepted: false },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ members, invites });
  } catch (err) {
    console.error("Team GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { email, role }: { email: string; role: string } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "email and role are required" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await db.teamInvite.create({
      data: {
        companyId: company.id,
        email,
        role: role as UserRole,
        expiresAt,
      },
    });

    return NextResponse.json({ invite });
  } catch (err) {
    console.error("Team POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId }: { userId: string } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Can't delete self
    const { userId: clerkUserId } = await auth();
    const selfRecord = await db.companyUser.findFirst({
      where: { clerkUserId: clerkUserId ?? "", companyId: company.id },
    });

    if (selfRecord?.id === userId) {
      return NextResponse.json({ error: "Cannot remove yourself from the team" }, { status: 403 });
    }

    // Verify the user belongs to this company
    const target = await db.companyUser.findFirst({
      where: { id: userId, companyId: company.id },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found in this company" }, { status: 404 });
    }

    await db.companyUser.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Team DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
