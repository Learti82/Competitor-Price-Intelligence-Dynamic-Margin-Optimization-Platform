import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { StorePricesClient } from "./store-prices-client";

async function getData(companyId: string) {
  const [stores, products, overrides] = await Promise.all([
    db.store.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, city: true },
    }),
    db.product.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
      take: 100,
      select: { id: true, name: true, sku: true, currentPrice: true },
    }),
    db.storeProductPrice.findMany({
      where: { store: { companyId } },
      include: {
        store: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true, currentPrice: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { stores, products, overrides };
}

export default async function StorePricesPage() {
  const company = await requireCompany();
  const { stores, products, overrides } = company
    ? await getData(company.id)
    : { stores: [], products: [], overrides: [] };

  return (
    <div className="flex flex-col">
      <Header
        title="Çmimet Sipas Dyqanit"
        subtitle="Vendos çmime të ndryshme për dyqane specifike"
      />
      <div className="p-6">
        <StorePricesClient
          stores={stores}
          products={products}
          initialOverrides={overrides}
        />
      </div>
    </div>
  );
}
