import { SelloraIcon } from "@/components/ui/logo";

/**
 * Floating "Powered by Sellora" badge for published stores and portfolios.
 * Fixed to the bottom-right corner so it stays on screen as visitors scroll.
 * Uses a solid, blurred backing so it stays legible over any theme (light or
 * dark) and links back to Sellora (a soft referral).
 */
export function SelloraBadge() {
  return (
    <a
      href="/?ref=badge"
      target="_blank"
      rel="noopener noreferrer"
      title="Build your own store and portfolio on Sellora"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full border border-black/10 bg-white/90 shadow-lg text-xs font-semibold text-gray-700 transition-all hover:bg-white hover:shadow-xl"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <SelloraIcon size={18} />
      <span>
        Powered by <span style={{ color: "#2e9cfe" }}>Sellora</span>
      </span>
    </a>
  );
}
