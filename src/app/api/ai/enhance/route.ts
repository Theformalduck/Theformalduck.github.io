import { chat } from "@/lib/openrouter";
import { NextResponse } from "next/server";

const MODE_PROMPTS: Record<string, string> = {
  professional: "polished, results-driven, and professional — emphasizing leadership, cross-functional impact, and measurable outcomes using strong action verbs",
  technical:    "highly technical and precise — highlighting specific technologies, architectures, scale, and engineering decisions",
  creative:     "engaging and narrative-driven — painting a vivid picture of impact while still grounding it in real accomplishments",
  startup:      "fast-paced, scrappy, and founder-minded — emphasizing speed of execution, ownership, and outsized impact with limited resources",
  corporate:    "formal and achievement-oriented — focused on business value, stakeholder alignment, and enterprise-scale outcomes",
};

export async function POST(req: Request) {
  try {
    const { bullet, mode, role, company, allBullets } = await req.json();
    const modeDesc = MODE_PROMPTS[mode] || MODE_PROMPTS.professional;

    const prompt = `You are an expert resume writer. Rewrite the following resume bullet point to be ${modeDesc}.

Context:
- Role: ${role}
- Company: ${company}
- Current bullet: "${bullet}"
${allBullets ? `- Other bullets for context (do not repeat): ${(allBullets as string[]).filter(b => b !== bullet).map(b => `"${b}"`).join(", ")}` : ""}

Rules:
- Start with a strong past-tense action verb
- Include specific metrics or percentages if plausible (realistic estimates are fine)
- Keep it to 1–2 sentences, max 200 characters
- Return ONLY the rewritten bullet — no quotes, no explanation, no prefix
- Write like a real professional wrote this, not AI — vary sentence structure, use concrete specifics
- NEVER use these AI-telltale words: leverage, delve, seamlessly, transformative, revolutionize, crucial, cutting-edge, game-changer, utilize (use "use"), facilitate, multifaceted, spearhead (unless naturally fitting), it's worth noting, in today's landscape
- Avoid formulaic "Verb + noun + resulting in X%" every single time — mix it up

Rewritten bullet:`;

    const text = await chat(prompt);
    return NextResponse.json({ text: text.replace(/^["']|["']$/g, "") });
  } catch (err) {
    console.error("enhance error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
