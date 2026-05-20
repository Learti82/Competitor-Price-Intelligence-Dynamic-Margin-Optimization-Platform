import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCompany, getAuthUser } from "@/lib/get-company";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const alerts = await db.marginAlert.findMany({
      where: { companyId: company.id, ...(unreadOnly && { isRead: false }) },
      include: { product: { select: { name: true, sku: true, category: true } } },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("Alerts error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, markAllRead } = await req.json();
    const userId = await getAuthUser();
    const company = await requireCompany();
    if (!company || !userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (markAllRead) {
      await db.marginAlert.updateMany({
        where: { companyId: company.id, isRead: false },
        data: { isRead: true, readAt: new Date(), readBy: userId },
      });
    } else if (id) {
      await db.marginAlert.update({
        where: { id },
        data: { isRead: true, readAt: new Date(), readBy: userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Alert update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
