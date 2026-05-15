import { auth } from "@/auth";
import { checkAndIncrementAIUsage } from "@/lib/aiUsage";
import { NextResponse } from "next/server";

const PURPOSE_CONTEXT: Record<string, string> = {
  general: "general writing",
  essay: "an academic essay",
  article: "a blog article or editorial",
  cover_letter: "a professional cover letter",
  email: "a professional email",
  social: "a LinkedIn post or social media caption",
  report: "a business report",
};

// Words/phrases that consistently raise AI scores
const AI_TELLS = [
  "delve", "leverage", "utilize", "facilitate", "furthermore", "moreover",
  "comprehensive", "robust", "innovative", "revolutionize", "seamlessly",
  "cutting-edge", "transformative", "underscores", "emphasizes", "showcases",
  "in conclusion", "to summarize", "in summary", "in today's world",
  "in today's landscape", "navigate the complexities", "tapestry",
  "multifaceted", "nuanced", "fosters", "cultivates", "paradigm",
  "synergy", "holistic", "ever-evolving", "game-changer",
];

async function callModel(
  model: string,
  systemPrompt: string,
  userText: string,
  temp = 0.95,
  freqPenalty = 0.4,
) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://folio.ai",
        "X-Title": "Folio.ai",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        max_tokens: 3000,
        temperature: temp,
        top_p: 0.95,
        frequency_penalty: freqPenalty,
        presence_penalty: 0.3,
      }),
    },
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${err}`);
  }
  const data = await response.json();
  const out = data.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("Empty response");
  return out;
}

// PASS 1 — strip the surface. We don't paraphrase the text; we extract claims.
// This is the single most important step. Statistical fingerprints live in
// phrasing, not ideas, so we throw the phrasing away.
function ideaExtractionPrompt() {
  return `Read the text and output a flat bullet list of the ideas, claims, and observations it contains.
- 6 to 14 bullets, in the order they appear.
- Each bullet 4 to 12 words. No adjectives unless load-bearing.
- Strip transitions, intros, conclusions, and rhetorical flourishes entirely.
- Use blunt plain English. Imagine you're texting a friend the gist.
- Do not preserve a single phrase from the original.

Output only the bullets. Nothing before or after.`;
}

// PASS 2 — generate a fresh draft. Situation-based framing, not a rule checklist.
// Giving the model a checklist of human behaviors causes it to apply them mechanically,
// which is itself detectable. A writing SITUATION produces more natural variation.
function humanizationPrompt(purposeContext: string, aggressiveness: string) {
  return `You are a real person writing ${purposeContext}. You just glanced over some notes and now you\'re putting them into words. You are not performing expertise. You are not trying to sound polished. You are just writing.

How your writing naturally comes out:
- Sentence lengths are completely uneven. Short. Then a longer one that winds around a bit (maybe with a small aside tucked in) before it finally lands on the point. Then short again.
- You don\'t always bridge ideas with transitions. Sometimes you just start the next thought without connecting it to the last one.
- Contractions are just how you write — it\'s, don\'t, you\'re, I\'d, we\'ve, that\'s, can\'t, they\'re.
- You start sentences with And, But, So, or Because. Yes, even here.
- You think in concrete things: a specific number, a name, a place, a year, a small scene. Abstract nouns are not your thing.
- You occasionally correct yourself mid-thought or acknowledge something didn\'t come out right.
- You open with a specific detail, a scene, a question you then answer, or a mild admission. Never a thesis. Never "In recent years."
- You end quietly — a trailing thought, a half-formed idea, something personal. Not a call to action. Not a moral.

${aggressiveness}

HARD BANS — violating any of these is failure:
- Em-dashes (—): use parens, a hyphen (-), or end the sentence
- Semicolons
- "In conclusion", "To summarize", "Furthermore", "Moreover", "Additionally", "In summary"
- Three consecutive sentences of similar length
- Two consecutive paragraphs that open with the same word
- Smooth logical bridges between every paragraph — gaps are fine
- These words: ${AI_TELLS.join(", ")}

Output only the finished piece. No preamble. No labels. No quotation marks around it.`;
}

// PASS 3 — add human imperfections. NOT "polish" — the opposite.
// Smoothing out AI texture can make it MORE uniformly polished, which is itself detectable.
// Instead, we find places that are too smooth and deliberately roughen them.
function refinementPrompt() {
  return `Read this draft. Your job is NOT to make it more polished — it\'s to make it feel more like a real person actually wrote it.

Find these problems and fix them:
- Any em-dash (—): replace with parens, a hyphen, or a period
- Three or more consecutive sentences of similar length: break it (add a two-word sentence, or combine some into one long winding one)
- Two consecutive paragraphs that flow together smoothly with a logical bridge: cut the transition or replace it with an abrupt pivot — real people don\'t always connect ideas
- Any sentence that sounds like it belongs in a corporate memo or press release: make it more direct and specific
- Any abstract claim or general statement: swap in a concrete example, a number, a name, or a small scene
- Any paragraph that has no contraction, no fragment, and no parenthetical aside: add one of those three

Do not add polish. Do not smooth out the writing. Do not make the structure cleaner. Keep every factual point intact.

Output only the revised text.`;
}

// Deterministic cleanup. Catches things models miss even with explicit instructions.
function postProcess(text: string): string {
  let t = text;

  // Em-dashes are an extreme AI tell post-2024. Replace with hyphens or parens.
  t = t.replace(/\s*—\s*/g, " - ");
  // Curly quotes -> straight (LLMs tend to emit curly; humans on most keyboards don't).
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  // Ellipsis character -> three dots.
  t = t.replace(/…/g, "...");

  // Phrase swaps for the most-flagged tells.
  const swaps: [RegExp, string][] = [
    [/\bin today's (?:world|landscape|society|environment)\b/gi, "right now"],
    [/\bit is worth noting that\s*/gi, ""],
    [/\bit'?s important to note that\s*/gi, ""],
    [/\bit'?s important to remember that\s*/gi, ""],
    [/\bneedless to say,?\s*/gi, ""],
    [/\bit goes without saying that\s*/gi, ""],
    [/\bin conclusion,?\s*/gi, ""],
    [/\bto summarize,?\s*/gi, ""],
    [/\bin summary,?\s*/gi, ""],
    [/\bfurthermore,?\s*/gi, "Also, "],
    [/\bmoreover,?\s*/gi, "Plus, "],
    [/\badditionally,?\s*/gi, "Also, "],
    [/\butilize\b/gi, "use"],
    [/\butilizes\b/gi, "uses"],
    [/\butilized\b/gi, "used"],
    [/\bdelve into\b/gi, "get into"],
    [/\bleverage\b/gi, "use"],
    [/\bfacilitate\b/gi, "help"],
    [/\bcommence\b/gi, "start"],
    [/\bnumerous\b/gi, "lots of"],
    [/\bplethora of\b/gi, "tons of"],
    [/\bmyriad\b/gi, "many"],
    [/\bsubsequently\b/gi, "then"],
    [/\bnevertheless,?\s*/gi, "Still, "],
    [/\bnonetheless,?\s*/gi, "Still, "],
  ];
  for (const [pattern, replacement] of swaps) {
    t = t.replace(pattern, replacement);
  }

  // Tidy whitespace and stray leading spaces from removed phrases.
  t = t.replace(/  +/g, " ");
  t = t.replace(/\s+([.,!?;:])/g, "$1");
  // Capitalize sentence starts after our removals (e.g. "  the rest..." at start of line).
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase());

  return t.trim();
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const usage = await checkAndIncrementAIUsage(session.user.id);
    if (!usage.allowed) {
      return NextResponse.json({ error: "AI limit reached", limitReached: true, used: usage.used, limit: usage.limit }, { status: 429 });
    }

    const { text, bypass = "advanced", purpose = "general" } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }
    if (text.length > 12000) {
      return NextResponse.json({ error: "Text too long (max 12k chars)" }, { status: 400 });
    }

    const purposeContext = PURPOSE_CONTEXT[purpose] ?? "general writing";

    const aggressiveness =
      bypass === "aggressive"
        ? "Rewrite everything from scratch. Don't preserve a single phrase. Reorder ideas if a different order reads more naturally. Lose 'polish' before authenticity."
        : bypass === "advanced"
        ? "Every sentence should be different in structure and vocabulary from the source ideas. Bias toward informal even in formal contexts."
        : "Make it noticeably more conversational. Keep substance, change texture and rhythm.";

    // Stronger models follow these constraints far better than gpt-4o-mini.
    const MODELS = [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "anthropic/claude-3.5-haiku",
    ];

    let lastErr: unknown = null;
    let usedModel = "";
    let final = "";

    for (const model of MODELS) {
      try {
        const ideas = await callModel(model, ideaExtractionPrompt(), text, 0.4, 0.2);
        const draft = await callModel(
          model,
          humanizationPrompt(purposeContext, aggressiveness),
          ideas,
          bypass === "aggressive" ? 1.0 : 0.95,
          bypass === "aggressive" ? 0.8 : 0.65,
        );
        const refined = await callModel(model, refinementPrompt(), draft, 0.7, 0.4);
        final = postProcess(refined);
        usedModel = model;
        break;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    if (!final) {
      throw lastErr ?? new Error("All models failed");
    }

    return NextResponse.json({ output: final, model: usedModel });
  } catch (err) {
    console.error("humanize error:", err);
    return NextResponse.json(
      { error: "Failed to humanize - please try again" },
      { status: 500 },
    );
  }
}