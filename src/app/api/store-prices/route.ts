import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const storeIds = await db.store.findMany({
      where: { companyId: company.id },
      select: { id: true },
    });
    const ids = storeIds.map((s) => s.id);

    const prices = await db.storeProductPrice.findMany({
      where: { storeId: { in: ids } },
      include: {
        store: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ prices });
  } catch (err) {
    console.error("StoreProductPrice GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { storeId, productId, price }: { storeId: string; productId: string; price: number } = body;

    if (!storeId || !productId || price === undefined) {
      return NextResponse.json({ error: "storeId, productId, and price are required" }, { status: 400 });
    }

    // Verify store belongs to company
    const store = await db.store.findFirst({
      where: { id: storeId, companyId: company.id },
    });
    if (!store) {
      return NextResponse.json({ error: "Store not found or does not belong to this company" }, { status: 403 });
    }

    // Verify product belongs to company
    const product = await db.product.findFirst({
      where: { id: productId, companyId: company.id },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found or does not belong to this company" }, { status: 403 });
    }

    const record = await db.storeProductPrice.upsert({
      where: { storeId_productId: { storeId, productId } },
      create: { storeId, productId, price },
      update: { price },
    });

    return NextResponse.json({ record });
  } catch (err) {
    console.error("StoreProductPrice POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id }: { id: string } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify the record belongs to a store in this company
    const record = await db.storeProductPrice.findFirst({
      where: {
        id,
        store: { companyId: company.id },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found or does not belong to this company" }, { status: 404 });
    }

    await db.storeProductPrice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("StoreProductPrice DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
