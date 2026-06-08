"use client";

import { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";

interface Account { ownerId: string; name: string; role: string; isSelf: boolean }

export function AccountSwitcher() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    fetch("/api/team/accounts")
      .then((r) => r.json())
      .then((d) => { setAccounts(d.accounts ?? []); setActiveId(d.activeId ?? ""); })
      .catch(() => {});
  }, []);

  // Only show the switcher when the user actually staffs another account.
  if (accounts.length <= 1) return null;

  const active = accounts.find((a) => a.ownerId === activeId) ?? accounts[0];
  const roleLabel = (r: string) => r.charAt(0) + r.slice(1).toLowerCase();

  const select = async (ownerId: string) => {
    if (ownerId === activeId) return;
    await fetch("/api/team/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId }) });
    window.location.reload();
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={`flex items-center gap-2 h-9 px-2.5 rounded-xl border transition-colors text-left mr-1 ${active.isSelf ? "border-gray-200 hover:bg-gray-50" : "border-[#2e9cfe]/30 bg-[#2e9cfe]/5 hover:bg-[#2e9cfe]/10"}`}>
          <Building2 className={`w-3.5 h-3.5 ${active.isSelf ? "text-gray-400" : "text-[#2e9cfe]"}`} />
          <div className="hidden md:block">
            <div className="text-[10px] text-gray-400 leading-none">{active.isSelf ? "Your account" : "Acting as"}</div>
            <div className="text-[12px] font-semibold text-gray-800 leading-tight max-w-[120px] truncate">{active.name}</div>
          </div>
          <ChevronsUpDown className="w-3 h-3 text-gray-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-50 w-60 rounded-xl bg-white border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-1 mt-2" sideOffset={8} align="start">
          <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Switch account</p>
          {accounts.map((a) => (
            <DropdownMenu.Item key={a.ownerId} onSelect={() => select(a.ownerId)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-[13px] cursor-pointer outline-none">
              <div className="flex-1 min-w-0">
                <div className="text-gray-800 truncate">{a.name}{a.isSelf && <span className="text-gray-400"> (you)</span>}</div>
                <div className="text-[11px] text-gray-400">{a.isSelf ? "Owner" : roleLabel(a.role)}</div>
              </div>
              {a.ownerId === activeId && <Check className="w-3.5 h-3.5 text-[#2e9cfe] flex-shrink-0" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
