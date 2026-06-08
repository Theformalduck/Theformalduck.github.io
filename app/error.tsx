"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SelloraIcon } from "@/components/ui/logo";
import { RotateCcw, Home } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-[#eaf4ff] to-white">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <SelloraIcon size={32} />
        <span className="font-bold text-lg tracking-tight text-gray-900">Sellora</span>
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-3 max-w-md text-gray-500 leading-relaxed">
        An unexpected error occurred. You can try again, or head back home.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#c8e83c] text-gray-900 hover:bg-[#b8d82c] transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back home
        </Link>
      </div>
    </main>
  );
}
