import { chat } from "@/lib/openrouter";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { portfolio } = await req.json();

    const projectSummary = (portfolio.projects || [])
      .map((p: { name: string; desc: string; tags: string; link: string }) =>
        `"${p.name}" — ${p.desc || "(no description)"} [${p.tags || "no tags"}]${p.link ? ` (link: ${p.link})` : ""}`
      )
      .join("\n") || "(no projects)";

    const skillSummary = (portfolio.skills || [])
      .map((g: { category: string; items: string[] }) => `${g.category}: ${g.items.join(", ")}`)
      .join(" | ") || "(no skills)";

    const expSummary = (portfolio.experience || [])
      .map((e: { role: string; company: string; period: string; desc: string }) =>
        `${e.role} at ${e.company} (${e.period}) — ${e.desc || "(no description)"}`
      )
      .join("\n") || "(no experience)";

    const prompt = `You are a personal branding expert and career coach. Analyze this developer portfolio and produce an accurate, specific brand score.

PORTFOLIO DATA:
Name: ${portfolio.name || "(not set)"}
Title: ${portfolio.title || "(not set)"}
Bio: ${portfolio.bio || "(not set)"}
Email: ${portfolio.email || "(not set)"}
GitHub: ${portfolio.github || "(not set)"}
LinkedIn: ${portfolio.linkedin || "(not set)"}
Twitter/X: ${portfolio.twitter || "(not set)"}
Profile photo: ${portfolio.photo ? "yes" : "no"}

Projects (${(portfolio.projects || []).length}):
${projectSummary}

Skills:
${skillSummary}

Experience:
${expSummary}

Testimonials: ${(portfolio.testimonials || []).length}

Score each category strictly and honestly based on the actual content above:

1. profile_completeness (0–100): All identity fields filled, bio length ≥100 chars, email + at least 2 social links, has photo
2. content_quality (0–100): Projects have real descriptions (≥80 chars), meaningful tags, links; 2+ skill groups with 3+ items each; experience has descriptions
3. personal_branding (0–100): Bio communicates value prop and tech stack clearly, bio is ≥80 chars and not generic, projects show range
4. seo_readiness (0–100): Bio and project descriptions mention specific technologies and outcomes; contact is accessible

Deduct points for: empty fields, placeholder text (like "john@example.com" or "github.com/johndoe"), no profile photo, short/vague descriptions.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "overall": <weighted integer 0-100>,
  "label": "<Excellent|Good|Fair|Needs Work>",
  "breakdown": [
    { "label": "Profile completeness", "score": <int 0-100>, "tip": "<one specific fix>" },
    { "label": "Content quality", "score": <int 0-100>, "tip": "<one specific fix>" },
    { "label": "Personal branding", "score": <int 0-100>, "tip": "<one specific fix>" },
    { "label": "SEO readiness", "score": <int 0-100>, "tip": "<one specific fix>" }
  ],
  "strengths": [<up to 2 short specific strengths>],
  "gaps": [<up to 2 short specific gaps>]
}`;

    const raw = await chat(prompt, 800);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("brand-score error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
