import { requireCompany } from "@/lib/get-company";
import { Header } from "@/components/layout/header";
import { ProductsTable } from "@/components/dashboard/products-table";
import { ExportButton } from "@/components/ui/export-button";
import { BulkUpdateModal } from "@/components/dashboard/bulk-update-modal";
import { db } from "@/lib/db";

async function getProducts(search?: string) {
  const company = await requireCompany();
  if (!company) return [];

  return db.product.findMany({
    where: {
      companyId: company.id,
      isActive: true,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { nameAlbanian: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
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
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getProducts(q);

  return (
    <div className="flex flex-col">
      <Header
        title="Katalogu i Produkteve"
        subtitle={
          q
            ? `${products.length} rezultate për "${q}"`
            : `${products.length} SKU aktive • Rendosur sipas marzhit (më i ulëti i pari)`
        }
        actions={
          <div className="flex items-center gap-2">
            <BulkUpdateModal productIds={products.map((p) => p.id)} />
            <ExportButton type="products" label="Eksporto Excel" />
          </div>
        }
      />
      <div className="p-6">
        {q && products.length === 0 && (
          <div className="mb-4 rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">
            Asnjë produkt nuk u gjet për <span className="text-white font-medium">"{q}"</span>.{" "}
            <a href="/dashboard/products" className="text-blue-400 hover:underline">
              Pastro kërkimin
            </a>
          </div>
        )}
        <ProductsTable products={products} />
      </div>
    </div>
  );
}
