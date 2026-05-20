import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/get-company";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let data: Record<string, unknown>[] = [];
    let sheetName = "Export";

    if (type === "products") {
      const products = await db.product.findMany({ where: { companyId: company.id }, orderBy: { name: "asc" } });
      sheetName = "Produktet";
      data = products.map((p) => ({
        SKU: p.sku, Barcode: p.barcode ?? "", Emri: p.name, Brendi: p.brand ?? "", Kategoria: p.category,
        "Çmimi Aktual (€)": p.currentPrice, "COGS (€)": p.cogs,
        "Marzhi (%)": p.currentMargin.toFixed(2), "Marzhi Min (%)": p.minMargin, "Marzhi Max (%)": p.maxMargin,
        Aktiv: p.isActive ? "Po" : "Jo",
      }));
    } else if (type === "competitors") {
      const competitors = await db.competitor.findMany({ orderBy: { name: "asc" } });
      sheetName = "Konkurrentët";
      data = competitors.map((c) => ({
        Emri: c.name, Qyteti: c.hqCity, "Numri i Dyqaneve": c.numberOfStores,
        Strategjia: c.pricingStrategy ?? "", Website: c.websiteUrl ?? "", Aktiv: c.isActive ? "Po" : "Jo",
      }));
    } else if (type === "recommendations") {
      const recs = await db.priceRecommendation.findMany({
        where: { companyId: company.id },
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { createdAt: "desc" }, take: 500,
      });
      sheetName = "Rekomandimet";
      data = recs.map((r) => ({
        Produkti: r.product.name, SKU: r.product.sku,
        "Çmimi Aktual (€)": r.currentPrice, "Çmimi i Rekomanduar (€)": r.recommendedPrice,
        "Marzhi Aktual (%)": r.currentMargin.toFixed(2), "Marzhi i Rekomanduar (%)": r.recommendedMargin.toFixed(2),
        "Besueshmëria (%)": (r.confidenceScore * 100).toFixed(0),
        "Delta Të Ardhurat (€)": r.expectedRevenueDelta.toFixed(2),
        Statusi: r.status, Arsyeja: r.rationale, "Krijuar më": r.createdAt.toISOString().slice(0, 10),
      }));
    } else if (type === "alerts") {
      const alerts = await db.marginAlert.findMany({
        where: { companyId: company.id },
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: "desc" }, take: 500,
      });
      sheetName = "Njoftimet";
      data = alerts.map((a) => ({
        Titulli: a.title, Lloji: a.alertType, Rëndësia: a.severity,
        Produkti: a.product?.name ?? "", Lexuar: a.isRead ? "Po" : "Jo",
        "Krijuar më": a.createdAt.toISOString().slice(0, 10),
      }));
    } else if (type === "audit") {
      const logs = await db.auditLog.findMany({
        where: { companyId: company.id }, orderBy: { createdAt: "desc" }, take: 1000,
      });
      sheetName = "Auditimi";
      data = logs.map((l) => ({
        Veprimi: l.action, Entiteti: l.entityType, "ID Entitetit": l.entityId ?? "",
        Përdoruesi: l.userName, Arsyeja: (l as any).reason ?? "",
        "Krijuar më": l.createdAt.toISOString().slice(0, 10),
      }));
    } else {
      return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pricesync-${type}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
