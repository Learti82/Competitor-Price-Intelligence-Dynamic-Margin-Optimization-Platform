import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const company = await db.company.findFirst({
      where: { clerkOrgId: "demo_org_markal" },
    });
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const stores = await db.store.findMany({
      where: { companyId: company.id, isActive: true },
      orderBy: { region: "asc" },
    });

    return NextResponse.json({ stores });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
