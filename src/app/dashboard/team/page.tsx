import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { TeamClient } from "./team-client";

async function getData(companyId: string) {
  const [members, invites] = await Promise.all([
    db.companyUser.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    }),
    db.teamInvite.findMany({
      where: { companyId, accepted: false },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { members, invites };
}

export default async function TeamPage() {
  const company = await requireCompany();
  const { members, invites } = company
    ? await getData(company.id)
    : { members: [], invites: [] };

  return (
    <div className="flex flex-col">
      <Header
        title="Ekipi & Rolet"
        subtitle="Menaxho anëtarët e ekipit tuaj"
      />
      <div className="p-6">
        <TeamClient initialMembers={members} initialInvites={invites} />
      </div>
    </div>
  );
}
