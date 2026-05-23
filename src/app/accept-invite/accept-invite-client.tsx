"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  token: string;
  isLoggedIn: boolean;
}

export function AcceptInviteClient({ token, isLoggedIn }: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  async function handleAccept() {
    if (!isLoggedIn) {
      const redirectUrl = `/accept-invite?token=${token}`;
      router.push(`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`);
      return;
    }
    setAccepting(true);
    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim gjatë pranimit");
      toast.success("Ju u bashkuat me ekipin!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <Button
      onClick={handleAccept}
      disabled={accepting}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
    >
      {accepting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      {isLoggedIn ? "Pranoje ftesën" : "Regjistrohu për të pranuar"}
    </Button>
  );
}
