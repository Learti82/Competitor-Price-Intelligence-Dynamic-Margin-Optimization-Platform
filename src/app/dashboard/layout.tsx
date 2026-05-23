import { Sidebar } from "@/components/layout/sidebar";
import { requireCompanyOrInit } from "@/lib/get-company";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const company = await requireCompanyOrInit();
  if (!company) redirect("/sign-in");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}
