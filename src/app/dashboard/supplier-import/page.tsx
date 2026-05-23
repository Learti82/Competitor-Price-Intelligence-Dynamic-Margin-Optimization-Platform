import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { SupplierImportClient } from "./supplier-import-client";

async function getProducts(companyId: string) {
  return db.product.findMany({
    where: { companyId, isActive: true },
    select: { id: true, sku: true, name: true, cogs: true },
    orderBy: { name: "asc" },
  });
}

export default async function SupplierImportPage() {
  const company = await requireCompany();
  const products = company ? await getProducts(company.id) : [];

  return (
    <div className="flex flex-col">
      <Header
        title="Importo Kostot nga Furnizuesi"
        subtitle="Përditëso COGS nga fatura e furnizuesit"
      />
      <div className="p-6">
        <SupplierImportClient products={products} />
      </div>
    </div>
  );
}
