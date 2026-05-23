import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { AcceptInviteClient } from "./accept-invite-client";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InviteError message="Mungon tokeni i ftesës." />;
  }

  const invite = await db.teamInvite.findUnique({
    where: { token },
    include: { company: true },
  });

  if (!invite) {
    return <InviteError message="Ftesa nuk u gjet." />;
  }

  if (invite.accepted) {
    return <InviteError message="Kjo ftesë është pranuar tashmë." />;
  }

  if (invite.expiresAt < new Date()) {
    return <InviteError message="Kjo ftesë ka skaduar." />;
  }

  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-white mb-2">Ftesë për t&apos;u Bashkuar</h1>
        <p className="text-sm text-gray-400 mb-6">
          Jeni ftuar të bashkoheni me <strong className="text-white">{invite.company.name}</strong>{" "}
          në PriceSync Manager si <strong className="text-blue-400">{invite.role}</strong>.
        </p>
        <div className="rounded-lg border border-gray-800 bg-gray-800/50 px-4 py-3 mb-6">
          <p className="text-xs text-gray-500">Email i ftuar</p>
          <p className="text-sm text-white">{invite.email}</p>
        </div>
        <AcceptInviteClient token={token} isLoggedIn={Boolean(userId)} />
      </div>
    </div>
  );
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-red-900/40 bg-gray-900 p-8 shadow-xl text-center">
        <h1 className="text-xl font-semibold text-red-400 mb-2">Ftesa e Pavlefshme</h1>
        <p className="text-sm text-gray-400">{message}</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          Kthehu në kreun
        </a>
      </div>
    </div>
  );
}
