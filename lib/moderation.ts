// ─────────────────────────────────────────────────────────────────────────────
// Automatic content moderation for user-to-user text (messages, posts,
// comments, reviews, group info, …).
//
// This is a server-side, dependency-free filter. It catches the things people
// use to abuse each other — slurs/hate speech, threats, self-harm
// encouragement, and sexual harassment — even when obfuscated with leetspeak
// ("n1gg3r"), spacing/punctuation ("k.y.s", "f u c k"), or letter elongation
// ("faaag"). It is intentionally tuned to block *abuse*, not ordinary swearing,
// to keep false positives low.
//
// It is not a substitute for human review or an ML classifier — a determined
// abuser can evade any wordlist. Treat it as a strong first line of defense
// that stops the overwhelming majority of casual abuse at the point of posting.
// ─────────────────────────────────────────────────────────────────────────────

export const MODERATION_MESSAGE =
  "Your message looks like it may contain hate speech, harassment, threats, or slurs, which break our community guidelines. Please rephrase it and try again.";

export interface ModerationResult {
  ok: boolean;
  /** Internal category of the first violation (for logging, not shown to users). */
  category?: "hate" | "threat" | "sexual";
  /** User-facing explanation when blocked. */
  reason?: string;
}

// Map common obfuscation characters back to letters before matching. Separator
// characters (space . _ - * + ' " |) are handled by the matcher itself, so they
// are deliberately NOT in this map.
const LEET: Record<string, string> = {
  "@": "a", "4": "a",
  "8": "b",
  "3": "e", "€": "e",
  "6": "g", "9": "g",
  "1": "i", "!": "i",
  "0": "o",
  "5": "s", "$": "s",
  "7": "t",
  "2": "z",
};

/**
 * Normalize text for matching: lowercase, fold leetspeak to letters, and
 * collapse any character repeated 3+ times down to one (so "faaaag" → "fag",
 * while real doubles like the "ss" in "pass" survive).
 */
function normalize(input: string): string {
  let out = "";
  for (const ch of input.toLowerCase()) out += LEET[ch] ?? ch;
  return out.replace(/(.)\1{2,}/g, "$1");
}

// Characters abusers insert between letters to dodge filters ("f.u.c.k").
const SEP = "[\\s._\\-*+'\"|]{0,3}";

function escapeRegex(ch: string): string {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a boundary-anchored regex for a term. Each letter may be followed by a
 * few separator characters; words in a multi-word phrase are joined by
 * whitespace. Lookarounds require a non-alphanumeric boundary on each end, which
 * avoids the "Scunthorpe problem" (matching a bad word inside an innocent one).
 */
function termToRegex(term: string): RegExp {
  const words = term.toLowerCase().split(/\s+/);
  const body = words
    .map((w) => Array.from(w).map(escapeRegex).join(SEP))
    .join("\\s+");
  return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`, "i");
}

// ── Block lists ──────────────────────────────────────────────────────────────
// Plain terms below are obfuscation-tolerant via termToRegex. Keep entries
// lowercase. These exist solely so the filter can recognize and reject abuse.

const HATE: string[] = [
  // Racial / ethnic slurs
  "nigger", "nigga", "niggers", "coon", "chink", "chinks", "spic", "spics",
  "wetback", "gook", "kike", "kikes", "beaner", "sandnigger", "porchmonkey",
  "jiggaboo", "towelhead", "raghead", "paki", "pakis", "darkie",
  // Anti-LGBTQ slurs
  "faggot", "faggots", "fag", "fags", "dyke", "dykes", "tranny", "trannies",
  "shemale", "homo",
  // Ableist slurs
  "retard", "retards", "retarded", "tard", "spaz", "mongoloid",
  // Misogynistic / dehumanizing slurs commonly used as abuse
  "cunt", "cunts",
];

const THREAT: string[] = [
  // Self-harm / suicide encouragement
  "kys", "kill yourself", "kill yourselves", "kill urself", "kill ur self",
  "go kill yourself", "neck yourself", "hang yourself", "hang urself",
  "slit your wrists", "slit your throat", "drink bleach", "go die", "just die",
  "you should die", "i hope you die", "i hope you rot", "end your life",
  "end yourself", "rope yourself", "an hero",
  // Violent threats
  "i will kill you", "im going to kill you", "i am going to kill you",
  "i will find you and kill", "i will hurt you", "i will beat you",
  "i will rape you", "im going to hurt you",
];

const SEXUAL: string[] = [
  // Sexual harassment / coercion directed at a person
  "rape you", "raping you", "i will rape", "send nudes", "send me nudes",
  "show me your tits", "suck my dick", "suck my cock", "choke on my",
  "you want my dick", "sit on my", "i want to rape",
];

interface Matcher {
  category: "hate" | "threat" | "sexual";
  patterns: RegExp[];
}

const MATCHERS: Matcher[] = [
  { category: "hate", patterns: HATE.map(termToRegex) },
  { category: "threat", patterns: THREAT.map(termToRegex) },
  { category: "sexual", patterns: SEXUAL.map(termToRegex) },
];

/**
 * Screen a piece of user text. Returns `{ ok: true }` when it passes, or
 * `{ ok: false, category, reason }` when it should be blocked.
 */
export function moderateText(input: string | null | undefined): ModerationResult {
  if (!input) return { ok: true };
  const text = normalize(input);
  for (const { category, patterns } of MATCHERS) {
    for (const re of patterns) {
      if (re.test(text)) {
        return { ok: false, category, reason: MODERATION_MESSAGE };
      }
    }
  }
  return { ok: true };
}

/** Convenience: moderate several fields at once (skips empty ones). */
export function moderateFields(...fields: (string | null | undefined)[]): ModerationResult {
  for (const f of fields) {
    const r = moderateText(f);
    if (!r.ok) return r;
  }
  return { ok: true };
}
