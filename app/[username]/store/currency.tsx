"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { CURRENCIES, formatMoney, isCurrency } from "@/lib/currencies";

const STORAGE_KEY = "sellora_display_currency";
const EVENT = "sellora-currency-change";

// Context carries only the active currency code; consumers derive a formatter.
const CurrencyContext = createContext<string>("USD");

/**
 * Tracks the shopper's selected display currency, persisted to localStorage and
 * synced across pages/tabs. `base` is the store's processing currency and the
 * fallback; `allowed` restricts which codes may be selected for this store.
 */
export function useDisplayCurrency(base = "USD", allowed?: string[]) {
  const permitted = allowed && allowed.length ? allowed : [base];
  const [code, setCode] = useState(base);

  useEffect(() => {
    const read = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCode(stored && isCurrency(stored) && permitted.includes(stored) ? stored : base);
    };
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener("storage", read);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, permitted.join(",")]);

  const set = useCallback((next: string) => {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const fmt = useCallback((usd: number) => formatMoney(usd, code), [code]);

  return { code, set, fmt };
}

export function CurrencyProvider({ code, children }: { code: string; children: React.ReactNode }) {
  return <CurrencyContext.Provider value={code}>{children}</CurrencyContext.Provider>;
}

/** Formatter for components nested under a CurrencyProvider. */
export function useFmt() {
  const code = useContext(CurrencyContext);
  return useCallback((usd: number) => formatMoney(usd, code), [code]);
}

/** Dropdown letting shoppers switch the display currency. */
export function CurrencySwitcher({
  code, options, onChange, accent, textColor,
}: {
  code: string;
  options: string[];
  onChange: (code: string) => void;
  accent?: string;
  textColor?: string;
}) {
  const [open, setOpen] = useState(false);
  if (options.length < 2) return null;
  const current = CURRENCIES[code] ?? CURRENCIES.USD;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
        style={{ borderColor: "rgba(0,0,0,0.12)", color: textColor ?? "inherit" }}
        aria-label="Change currency"
      >
        <span>{current.code}</span>
        <span className="opacity-60">{current.symbol}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-50 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1 min-w-[180px]">
          {options.map(opt => {
            const def = CURRENCIES[opt];
            if (!def) return null;
            return (
              <button
                key={opt}
                onMouseDown={() => { onChange(opt); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between"
                style={opt === code ? { color: accent ?? "#2e9cfe", fontWeight: 600 } : { color: "#374151" }}
              >
                <span>{def.name}</span>
                <span className="opacity-60">{def.code} {def.symbol}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
