import Link from "next/link";
import { SelloraIcon } from "@/components/ui/logo";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-[#eaf4ff] to-white">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <SelloraIcon size={32} />
        <span className="font-bold text-lg tracking-tight text-gray-900">Sellora</span>
      </Link>

      <p className="text-[5.5rem] sm:text-[7rem] font-black leading-none tracking-tight bg-gradient-to-b from-[#49a8f6] to-[#2b7fd0] bg-clip-text text-transparent">
        404
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">This page wandered off</h1>
      <p className="mt-3 max-w-md text-gray-500 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back on track.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#c8e83c] text-gray-900 hover:bg-[#b8d82c] transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back home
        </Link>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Compass className="w-4 h-4" />
          Explore creators
        </Link>
      </div>
    </main>
  );
}
