import { sanitizeText } from "@/lib/sanitize";

// Shared shapes + sanitizers for the JSON `faq` and `stretchGoals` fields on a
// Campaign. Used by the API (on write) and the client (typing reads).

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StretchGoal {
  amount: number;
  title: string;
  description: string;
}

const str = (v: unknown, max: number) =>
  sanitizeText(typeof v === "string" ? v : "", max) ?? "";

/** Validate/clean an FAQ array: drop incomplete rows, cap count + lengths. */
export function normalizeFaq(input: unknown): FaqItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row) => {
      const r = row as { question?: unknown; answer?: unknown };
      return { question: str(r?.question, 300), answer: str(r?.answer, 2000) };
    })
    .filter((f) => f.question && f.answer)
    .slice(0, 20);
}

/** Validate/clean stretch goals: positive amounts only, sorted ascending. */
export function normalizeStretchGoals(input: unknown): StretchGoal[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row) => {
      const r = row as { amount?: unknown; title?: unknown; description?: unknown };
      return {
        amount: Math.max(0, Math.round(Number(r?.amount) || 0)),
        title: str(r?.title, 200),
        description: str(r?.description, 1000),
      };
    })
    .filter((g) => g.amount > 0 && g.title)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 20);
}
