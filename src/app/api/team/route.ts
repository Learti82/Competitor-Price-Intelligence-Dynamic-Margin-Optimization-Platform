import { requireCompany, getActorName } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { Resend } from "resend";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  PRICING_MANAGER: "Menaxher Çmimesh",
  REGIONAL_MANAGER: "Menaxher Rajonal",
  ANALYST: "Analist",
  VIEWER: "Vëzhgues",
};

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

    let emailSent = false;
    const actorName = await getActorName();
    const roleLabel = ROLE_LABELS[role] ?? role;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const acceptUrl = `${appUrl}/accept-invite?token=${invite.token}`;

    let emailError: string | undefined;

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data: emailData, error: resendError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "PriceSync <onboarding@resend.dev>",
          to: invite.email,
          subject: `${actorName} ju ftoi në ${company.name} në PriceSync Manager`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#0f172a;color:#fff;border-radius:12px">
    <h2 style="color:#60a5fa">Ftesë për PriceSync Manager</h2>
    <p>${actorName} ju ftoi t'i bashkoheni kompanisë <strong>${company.name}</strong> si <strong>${roleLabel}</strong>.</p>
    <p>Kjo ftesë skadon në 7 ditë.</p>
    <a href="${acceptUrl}"
       style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
       Prano Ftesën
    </a>
    <p style="margin-top:24px;color:#94a3b8;font-size:14px">Nëse nuk e prisni këtë email, mund ta injoroni.</p>
  </div>`,
        });
        if (resendError) {
          console.error("[team-invite] Resend API error:", resendError);
          emailError = resendError.message;
        } else {
          console.log("[team-invite] Email sent successfully, id:", emailData?.id);
          emailSent = true;
        }
      } catch (emailErr) {
        console.error("[team-invite] Resend exception:", emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : "Unknown error";
      }
    } else {
      console.warn(
        "[team-invite] RESEND_API_KEY not set. Share link manually:",
        acceptUrl
      );
    }

    return NextResponse.json({ invite, emailSent, acceptUrl, emailError });
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
