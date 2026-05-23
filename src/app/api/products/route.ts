import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const where = {
      companyId: company.id,
      isActive: true,
      ...(category && { category: category as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          competitorMappings: {
            include: {
              competitorProduct: {
                include: {
                  competitor: { select: { name: true, slug: true } },
                  prices: { orderBy: { recordedAt: "desc" }, take: 1 },
                },
              },
            },
          },
          recommendations: {
            where: { status: "PENDING" },
            orderBy: { confidenceScore: "desc" },
            take: 1,
          },
        },
        orderBy: { currentMargin: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (err) {
    console.error("Products error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
