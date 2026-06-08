"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";

function AcceptInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState<{ ownerId: string; name: string } | null>(null);

  useEffect(() => {
    if (!token) { setState("error"); setMessage("This invite link is missing its token."); return; }
    fetch("/api/team/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Failed to accept invite");
        setAccount(d.account);
        setState("done");
      })
      .catch((e) => { setState("error"); setMessage(e.message); });
  }, [token]);

  const switchToAccount = async () => {
    if (!account) return;
    await fetch("/api/team/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId: account.ownerId }) });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center mt-10">
        {state === "loading" && (
          <><Loader2 className="w-7 h-7 animate-spin text-gray-400 mx-auto mb-4" /><p className="text-gray-500 text-sm">Accepting your invite…</p></>
        )}
        {state === "done" && (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-6 h-6 text-emerald-600" /></div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">You&apos;re on the team!</h1>
            <p className="text-sm text-gray-500 mb-5">You now have access to <strong>{account?.name}</strong>.</p>
            <button onClick={switchToAccount} className="w-full h-10 rounded-xl bg-[#2e9cfe] text-white text-sm font-semibold hover:bg-[#1a8cf0]">
              Switch to {account?.name}
            </button>
          </>
        )}
        {state === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-6 h-6 text-red-500" /></div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">Couldn&apos;t accept invite</h1>
            <p className="text-sm text-gray-500">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return <Suspense><AcceptInner /></Suspense>;
}
