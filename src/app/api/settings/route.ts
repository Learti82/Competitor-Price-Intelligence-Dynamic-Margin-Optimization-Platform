import { NextRequest, NextResponse } from "next/server";
import { requireCompany, getActorName, getAuthUser } from "@/lib/get-company";
import { db } from "@/lib/db";

const ALLOWED_FIELDS = new Set([
  "name",
  "nameAlbanian",
  "logoUrl",
  "hqCity",
  "hqAddress",
  "numberOfStores",
  "annualRevenue",
  "currency",
  "country",
  "timezone",
]);

export async function PATCH(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await getAuthUser();
    const actorName = await getActorName();

    const body = await req.json();
    let updates: Record<string, unknown> = {};

    if (body.updates && typeof body.updates === "object") {
      updates = body.updates as Record<string, unknown>;
    } else if (typeof body.field === "string") {
      updates = { [body.field]: body.value };
    } else {
      return NextResponse.json({ error: "Missing updates" }, { status: 400 });
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_FIELDS.has(key)) continue;
      sanitized[key] = value;
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const oldValue: Record<string, unknown> = {};
    for (const key of Object.keys(sanitized)) {
      oldValue[key] = (company as unknown as Record<string, unknown>)[key];
    }

    const updated = await db.company.update({
      where: { id: company.id },
      data: sanitized,
    });

    await db.auditLog.create({
      data: {
        companyId: company.id,
        userId: userId ?? "system",
        userName: actorName,
        action: "SETTINGS_UPDATED",
        entityType: "Company",
        entityId: company.id,
        oldValue: oldValue as object,
        newValue: sanitized as object,
      },
    });

    return NextResponse.json({ company: updated });
  } catch (err) {
    console.error("Settings PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
