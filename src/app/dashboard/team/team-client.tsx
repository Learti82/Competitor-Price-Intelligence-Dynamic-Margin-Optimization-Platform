"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2, UserPlus, Mail, Clock } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date | string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: Date | string;
}

interface TeamClientProps {
  initialMembers: Member[];
  initialInvites: Invite[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  PRICING_MANAGER: "Menaxher Çmimesh",
  REGIONAL_MANAGER: "Menaxher Rajonal",
  ANALYST: "Analist",
  VIEWER: "Vëzhgues",
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-blue-500/20 text-blue-400 border-blue-500/30 border",
  PRICING_MANAGER: "bg-green-500/20 text-green-400 border-green-500/30 border",
  REGIONAL_MANAGER: "bg-purple-500/20 text-purple-400 border-purple-500/30 border",
  ANALYST: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border",
  VIEWER: "bg-gray-700 text-gray-400 border-gray-600 border",
};

export function TeamClient({ initialMembers, initialInvites }: TeamClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ANALYST");
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [acceptLink, setAcceptLink] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      if (data.emailSent) {
        toast.success(`Email u dërgua me sukses te ${inviteEmail}!`);
      } else {
        setAcceptLink(data.acceptUrl ?? "");
        const reason = data.emailError
          ? `Gabim Resend: ${data.emailError}`
          : "RESEND_API_KEY nuk është vendosur.";
        toast.warning(`Email nuk u dërgua — ${reason} Kopjo linkun e ftesës poshtë.`, { duration: 10000 });
      }
      setInvites((prev) => [data.invite, ...prev]);
      setInviteEmail("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setInviting(false);
    }
  }

  async function handleDelete(memberId: string) {
    setDeletingId(memberId);
    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      toast.success("Anëtari u hoq nga ekipi");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Members table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Anëtarët e Ekipit</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">Nuk ka anëtarë ende.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="text-left py-2 pr-4">Emri</th>
                    <th className="text-left py-2 pr-4">Email</th>
                    <th className="text-left py-2 pr-4">Roli</th>
                    <th className="text-left py-2 pr-4">U bashkua</th>
                    <th className="text-left py-2">Veprim</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-gray-800/50 last:border-0">
                      <td className="py-3 pr-4 text-white font-medium text-xs">{m.name}</td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{m.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE_STYLES[m.role] ?? "bg-gray-700 text-gray-400"}`}>
                          {ROLE_LABELS[m.role] ?? m.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {format(new Date(m.createdAt), "dd/MM/yyyy")}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === m.id}
                          onClick={() => handleDelete(m.id)}
                          className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Hiq
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            Ftesat në Pritje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-gray-500">Nuk ka ftesa aktive.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-white">{inv.email}</p>
                      <p className="text-[11px] text-gray-500">
                        Skadon: {format(new Date(inv.expiresAt), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE_STYLES[inv.role] ?? "bg-gray-700 text-gray-400"}`}>
                    {ROLE_LABELS[inv.role] ?? inv.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-400" />
            Fto Anëtar të Ri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              required
              placeholder="email@kompania.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500 min-w-[180px]"
            >
              <option value="PRICING_MANAGER">Menaxher Çmimesh</option>
              <option value="REGIONAL_MANAGER">Menaxher Rajonal</option>
              <option value="ANALYST">Analist</option>
              <option value="VIEWER">Vëzhgues</option>
            </select>
            <Button
              type="submit"
              disabled={inviting}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 whitespace-nowrap"
            >
              <UserPlus className="h-4 w-4" />
              {inviting ? "Duke dërguar..." : "Dërgo Ftesë"}
            </Button>
          </form>
          {acceptLink && (
            <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <p className="text-xs text-blue-400 mb-2 font-medium">Linku i ftesës (kopjo dhe dërgoje manualisht):</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={acceptLink}
                  className="flex-1 rounded bg-gray-800 border border-gray-700 px-2 py-1.5 text-xs text-gray-300 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(acceptLink); toast.success("U kopjua!"); }}
                  className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1.5 border border-blue-500/30 rounded"
                >
                  Kopjo
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Dërgoje këtë link manualisht te personi i ftuar. Ai/ajo duhet të hyjë në PriceSync dhe të hapë këtë link për të pranuar ftesën.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
