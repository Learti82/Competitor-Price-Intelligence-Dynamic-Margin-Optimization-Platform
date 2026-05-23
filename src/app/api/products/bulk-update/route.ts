import { requireCompany, getActorName } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function calcMargin(price: number, cogs: number): number {
  return ((price - cogs) / price) * 100;
}

export async function POST(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      productIds,
      changeType,
      changeValue,
      reason,
    }: {
      productIds: string[];
      changeType: "PERCENTAGE" | "FIXED";
      changeValue: number;
      reason: string;
    } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "productIds is required and must be a non-empty array" }, { status: 400 });
    }

    if (changeType !== "PERCENTAGE" && changeType !== "FIXED") {
      return NextResponse.json({ error: "changeType must be PERCENTAGE or FIXED" }, { status: 400 });
    }

    // Verify all products belong to company
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        companyId: company.id,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Some products not found or do not belong to this company" }, { status: 403 });
    }

    const actorName = await getActorName();
    let updated = 0;

    for (const product of products) {
      let newPrice =
        changeType === "PERCENTAGE"
          ? product.currentPrice * (1 + changeValue / 100)
          : product.currentPrice + changeValue;

      // Clamp price so margin >= product.minMargin
      const minAllowedPrice = product.cogs / (1 - product.minMargin / 100);
      if (newPrice < minAllowedPrice) {
        newPrice = minAllowedPrice;
      }

      newPrice = Math.round(newPrice * 100) / 100;
      const newMargin = calcMargin(newPrice, product.cogs);

      await db.product.update({
        where: { id: product.id },
        data: {
          currentPrice: newPrice,
          currentMargin: newMargin,
        },
      });

      await db.productPrice.create({
        data: {
          productId: product.id,
          price: newPrice,
          cogs: product.cogs,
          margin: newMargin,
        },
      });

      updated++;
    }

    // Create one AuditLog for the bulk operation
    await db.auditLog.create({
      data: {
        companyId: company.id,
        userId: "system",
        userName: actorName,
        action: "BULK_PRICE_UPDATE",
        entityType: "Product",
        newValue: { count: updated, changeType, changeValue, reason },
        reason,
      },
    });

    return NextResponse.json({ updated });
  } catch (err) {
    console.error("Bulk update POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
