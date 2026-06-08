"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#2e9cfe] text-white text-sm font-semibold hover:opacity-90"
    >
      <Printer className="w-4 h-4" /> Print / Save PDF
    </button>
  );
}
