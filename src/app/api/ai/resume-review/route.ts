import { chat } from "@/lib/openrouter";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { resume } = await req.json();

    const expText = (resume.experience || [])
      .map((e: { role: string; company: string; period: string; bullets: { text: string }[] }) =>
        `${e.role} at ${e.company} (${e.period}):\n${e.bullets.map((b: { text: string }) => `  - ${b.text || "(empty)"}`).join("\n")}`
      )
      .join("\n\n") || "(no experience)";

    const skillText = (resume.skills || [])
      .map((g: { category: string; items: string[] }) => `${g.category}: ${g.items.join(", ")}`)
      .join(" | ") || "(no skills)";

    const projectText = (resume.projects || [])
      .map((p: { name: string; desc: string; tags: string; link: string }) =>
        `"${p.name}" — ${p.desc || "(no description)"} [${p.tags || "no tags"}]`
      )
      .join("\n") || "(no projects)";

    const prompt = `You are a senior recruiter and ATS expert. Analyze this resume and produce a detailed, accurate review.

RESUME:
Name: ${resume.name || "(not set)"}
Title: ${resume.title || "(not set)"}
Email: ${resume.email || "(not set)"}
Summary: ${resume.summary || "(not set)"}

Experience:
${expText}

Skills:
${skillText}

Projects:
${projectText}

Education: ${(resume.education || []).map((e: { school: string; degree: string }) => `${e.degree} at ${e.school}`).join(", ") || "(none)"}

Score each dimension STRICTLY based on the actual content above. Be honest — if bullets are vague or short, deduct points.

Scoring rules:
- first_impression (0-100): Can a recruiter grasp role + impact + level in 6 seconds? Deduct if name/title/summary is missing or generic.
- ats_keywords (0-100): Coverage of common engineering keywords. Check for: CI/CD, agile, cross-functional, cloud providers, testing, etc. Deduct for missing obvious ones.
- impact_clarity (0-100): Do bullets show measurable outcomes? Deduct heavily for "worked on", "helped with", "responsible for" phrasing. Reward specific numbers, percentages, user counts.
- formatting (0-100): Is the structure logical? Does it have all standard sections? Deduct if summary is <50 chars, or any section is empty.
- role_relevance (0-100): Does the resume match the stated job title? Are skills and experience aligned?

For feedback, identify the 4-6 most important issues or strengths. Be specific — reference actual text from the resume.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "overall": <weighted integer 0-100>,
  "label": "<Excellent|Strong|Good — with upside|Needs work|Weak>",
  "summary_verdict": "<2-3 sentence honest assessment of the resume's main strengths and biggest gap>",
  "critical_count": <integer>,
  "suggestion_count": <integer>,
  "strength_count": <integer>,
  "breakdown": [
    { "label": "First impression (6s test)", "score": <int 0-100>, "desc": "<1 sentence specific to this resume>" },
    { "label": "ATS keyword coverage", "score": <int 0-100>, "desc": "<1 sentence specific to this resume>" },
    { "label": "Impact clarity", "score": <int 0-100>, "desc": "<1 sentence specific to this resume>" },
    { "label": "Formatting & readability", "score": <int 0-100>, "desc": "<1 sentence specific to this resume>" },
    { "label": "Relevance to target roles", "score": <int 0-100>, "desc": "<1 sentence specific to this resume>" }
  ],
  "feedback": [
    {
      "section": "<section name e.g. Summary, Experience — Company Name, Skills, Projects, ATS>",
      "severity": "<critical|suggestion|positive>",
      "comment": "<specific, actionable feedback referencing actual resume content>"
    }
  ]
}`;

    const raw = await chat(prompt, 1200);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("resume-review error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
