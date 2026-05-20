import { Header } from "@/components/layout/header";
import { ProductsTable } from "@/components/dashboard/products-table";
import { ExportButton } from "@/components/ui/export-button";
import { db } from "@/lib/db";

async function getProducts() {
  const company = await db.company.findFirst({
    where: { clerkOrgId: "demo_org_markal" },
  });
  if (!company) return [];

  return db.product.findMany({
    where: { companyId: company.id, isActive: true },
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

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col">
      <Header
        title="Katalogu i Produkteve"
        subtitle={`${products.length} SKU aktive • Rendosur sipas marzhit (më i ulëti i pari)`}
        actions={<ExportButton type="products" label="Eksporto Excel" />}
      />
      <div className="p-6">
        <ProductsTable products={products} />
      </div>
    </div>
  );
}
