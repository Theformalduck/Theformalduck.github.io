import { chat } from "@/lib/openrouter";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { jobDesc, resume } = await req.json();

    const resumeText = [
      `Title: ${resume.title}`,
      `Summary: ${resume.summary}`,
      `Skills: ${(resume.skills as { category: string; items: string[] }[]).map(g => `${g.category}: ${g.items.join(", ")}`).join(" | ")}`,
      `Experience: ${(resume.experience as { role: string; company: string; bullets: { text: string }[] }[]).map(e => `${e.role} at ${e.company}: ${e.bullets.map(b => b.text).join("; ")}`).join("\n")}`,
    ].join("\n");

    const prompt = `You are an ATS (Applicant Tracking System) expert and career coach. Analyze how well this resume matches the job description.

JOB DESCRIPTION:
${jobDesc}

RESUME:
${resumeText}

Respond with ONLY a valid JSON object — no markdown, no explanation, no code fences:
{
  "score": <integer 0-100>,
  "matched_keywords": [<up to 5 keywords found in both>],
  "missing_keywords": [<up to 5 important keywords from the JD missing from the resume>],
  "strengths": [<up to 3 short strings about what matches well>],
  "gaps": [<up to 3 short strings about what is missing>]
}`;

    const raw = await chat(prompt);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("job-match error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
