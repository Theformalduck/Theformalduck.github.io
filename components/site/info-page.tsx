import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export function InfoPage({
  title, subtitle, updated, children,
}: {
  title: string;
  subtitle?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <header
        className="pt-32 pb-12 px-4 sm:px-6"
        style={{ background: "linear-gradient(180deg,#0a7cc4 0%,#1099e0 60%,#3dc8f5 100%)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-white/85 mt-3 max-w-xl mx-auto">{subtitle}</p>}
          {updated && <p className="text-white/60 text-sm mt-4">Last updated {updated}</p>}
        </div>
      </header>

      <main
        className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 text-[15px] text-gray-600 leading-relaxed
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:scroll-mt-24
          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5
          [&_li]:marker:text-gray-300
          [&_a]:text-blue-600 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:text-gray-900 [&_strong]:font-semibold"
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}

export const LEGAL_UPDATED = "May 30, 2026";
export const SUPPORT_EMAIL = "support@sellora.com";
export const LEGAL_EMAIL = "legal@sellora.com";
export const COMPANY = "Sellora Technologies, Inc.";
