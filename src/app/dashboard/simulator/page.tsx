import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { SimulatorClient } from "@/components/dashboard/simulator-client";

async function getProducts(companyId: string) {
  return db.product.findMany({
    where: { companyId, isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      currentPrice: true,
      cogs: true,
      currentMargin: true,
    },
    orderBy: { name: "asc" },
  });
}

export default async function SimulatorPage() {
  const company = await requireCompany();

  if (!company) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Kompania nuk u gjet.</p>
      </div>
    );
  }

  const products = await getProducts(company.id);

  return (
    <div className="flex flex-col">
      <Header
        title="Simulatori i të Ardhurave"
        subtitle="Llogarit ndikimin e ndryshimit të çmimit"
      />
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-400 text-sm">
            Nuk ka produkte të disponueshme për simulim.
          </p>
        </div>
      ) : (
        <SimulatorClient products={products} />
      )}
    </div>
  );
}
