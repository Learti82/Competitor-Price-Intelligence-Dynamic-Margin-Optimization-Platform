import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function calcMargin(price: number, cogs: number): number {
  if (price === 0) return 0;
  return ((price - cogs) / price) * 100;
}

export async function POST(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { updates }: { updates: { productId: string; newCogs: number }[] } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates array is required" }, { status: 400 });
    }

    // Verify all products belong to company
    const productIds = updates.map((u) => u.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, companyId: company.id },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Some products not found or do not belong to this company" },
        { status: 403 }
      );
    }

    let updated = 0;
    for (const upd of updates) {
      const product = products.find((p) => p.id === upd.productId);
      if (!product) continue;

      const newCogs = upd.newCogs;
      const newMargin = calcMargin(product.currentPrice, newCogs);

      await db.product.update({
        where: { id: product.id },
        data: {
          cogs: newCogs,
          currentMargin: newMargin,
        },
      });
      updated++;
    }

    return NextResponse.json({ updated });
  } catch (err) {
    console.error("SupplierImport POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
