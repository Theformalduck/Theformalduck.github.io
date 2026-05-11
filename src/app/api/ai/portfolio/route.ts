import { chat } from "@/lib/openrouter";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json();

    let prompt = "";

    if (action === "Generate bio") {
      prompt = `Write a compelling first-person bio for a developer portfolio website.

Name: ${data.name || "John Doe"}
Title: ${data.title || "Software Engineer"}
Skills: ${data.skills || "React, TypeScript, Node.js"}
Experience: ${data.experience || "4+ years building web applications"}

Rules:
- 2–3 sentences, conversational but professional
- Mention what they build and what they're passionate about
- End with something that invites collaboration
- Return ONLY the bio text, no quotes`;
    } else if (action === "Write case studies") {
      prompt = `Write a one-paragraph case study for a software project portfolio.

Project: ${data.project?.name || "AI Analytics Dashboard"}
Description: ${data.project?.desc || "Real-time data visualization platform"}
Technologies: ${data.project?.tags || "React, Node.js"}

Rules:
- 3–4 sentences: problem → solution → technologies → outcome/impact
- Specific and compelling
- Return ONLY the case study paragraph, no quotes`;
    } else if (action === "Add testimonials") {
      prompt = `Write 2 realistic, professional testimonials for a software engineer's portfolio.

Developer: ${data.name || "the developer"}
Role: ${data.title || "Software Engineer"}

Format:
"[Quote]" — [Fictional Name], [Title] at [Company]

Return ONLY the 2 testimonials separated by a blank line. No extra text.`;
    } else if (action === "Optimize for SEO") {
      prompt = `Write an SEO meta description and 5 keywords for a software engineer's portfolio.

Name: ${data.name || "John Doe"}
Title: ${data.title || "Software Engineer"}
Skills: ${data.skills || "React, TypeScript, Node.js"}

Return ONLY this JSON (no markdown, no code fences):
{"meta_description":"<under 160 chars>","keywords":["kw1","kw2","kw3","kw4","kw5"]}`;
    }

    if (!prompt) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    const text = await chat(prompt);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("portfolio error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
