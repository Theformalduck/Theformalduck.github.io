import { auth } from "@/auth";
import { chat } from "@/lib/openrouter";
import { checkAndIncrementAIUsage } from "@/lib/aiUsage";
import { NextResponse } from "next/server";

const MODE_PROMPTS: Record<string, string> = {
  professional: "polished and professional, suitable for senior roles at established companies",
  technical:    "technically detailed, highlighting engineering depth and specific technologies",
  creative:     "engaging and personality-driven, standing out in a sea of generic summaries",
  startup:      "startup-minded — fast, direct, ownership-focused",
  corporate:    "formal and achievement-oriented, suitable for enterprise or Fortune 500 companies",
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const usage = await checkAndIncrementAIUsage(session.user.id);
    if (!usage.allowed) {
      return NextResponse.json({ error: "AI limit reached", limitReached: true, used: usage.used, limit: usage.limit }, { status: 429 });
    }

    const { current, mode, title, experience } = await req.json();
    const modeDesc = MODE_PROMPTS[mode] || MODE_PROMPTS.professional;

    const expSummary = (experience as { role: string; company: string; bullets: { text: string }[] }[])
      .map(e => `${e.role} at ${e.company}: ${e.bullets.slice(0, 2).map(b => b.text).join("; ")}`)
      .join("\n");

    const prompt = `You are an expert resume writer. Write a professional summary for a resume.

Person's current title: ${title}
Writing tone: ${modeDesc}
Their experience:
${expSummary}
${current ? `Current summary to improve upon: "${current}"` : ""}

Rules:
- 2–3 sentences only (under 500 characters total)
- Start with the role and years of experience (e.g. "Senior Frontend Engineer with 4+ years…")
- Mention a key specialization or technology
- End with what they bring to a team or are seeking
- Return ONLY the summary text — no quotes, no explanation
- Write like a real person wrote this, not AI — natural rhythm, varied phrasing
- NEVER use: leverage, delve, seamlessly, transformative, passionate about (overused), revolutionize, cutting-edge, game-changer, utilize (use "use"), it's worth noting, in today's landscape, dedicated professional

Summary:`;

    const text = await chat(prompt);
    return NextResponse.json({ text: text.replace(/^["']|["']$/g, "") });
  } catch (err) {
    console.error("summary error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
