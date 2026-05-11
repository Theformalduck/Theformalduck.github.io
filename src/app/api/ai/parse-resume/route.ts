import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/openrouter";

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || file.type === "text/plain") {
    return file.text();
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // pdf-parse v2 ships as ESM with a class-based API:
    //   new PDFParse({ data: Buffer }).getText() → { text: string, pages: [...], total: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { PDFParse } = await import("pdf-parse") as any;
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return (result.text as string) ?? "";
  }

  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
}

const SYSTEM = `You are a resume parser. Extract structured data from resume text and return ONLY valid JSON — no markdown fences, no explanation, just the JSON object.`;

const PROMPT_TEMPLATE = (text: string) => `Parse the following resume into this exact JSON structure. Fill every field as best you can; use empty string "" for fields not found.

JSON structure to populate:
{
  "name": "Full name",
  "title": "Current or target job title",
  "email": "email address",
  "phone": "phone number",
  "location": "city, state or country",
  "website": "personal site URL (no https://)",
  "linkedin": "linkedin URL or handle (no https://)",
  "github": "github URL or handle (no https://)",
  "summary": "professional summary paragraph (2-4 sentences)",
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "period": "Start – End (e.g. Jan 2022 – Mar 2024)",
      "bullets": ["achievement bullet 1", "achievement bullet 2"]
    }
  ],
  "education": [
    {
      "school": "University or school name",
      "degree": "Degree and major",
      "period": "Start – End years",
      "gpa": "GPA if listed, else empty string"
    }
  ],
  "skills": [
    {
      "category": "Category name (e.g. Frontend, Backend, Tools)",
      "items": ["Skill 1", "Skill 2"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "desc": "1-2 sentence description",
      "link": "URL if present, else empty string",
      "tags": "comma-separated tech stack"
    }
  ]
}

Rules:
- Group skills into logical categories (Frontend, Backend, DevOps, Languages, Tools, etc.)
- Keep bullet points concise and achievement-focused
- If there is no summary in the resume, write a short one from the experience context
- Return ONLY the JSON object, nothing else

Resume text:
${text.slice(0, 12000)}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large — max 5MB" }, { status: 400 });
    }

    const text = await extractText(file);

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 422 });
    }

    const raw = await chat(PROMPT_TEMPLATE(text), 4000, 0.2, SYSTEM);

    // Extract the outermost JSON object regardless of surrounding text or fences
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("parse-resume raw response:", raw.slice(0, 500));
      throw new Error("AI returned no JSON object");
    }
    const parsed = JSON.parse(match[0]);

    return NextResponse.json({ data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parsing failed";
    console.error("parse-resume error:", err);
    // Distinguish AI JSON parse errors from extraction errors
    if (message.includes("JSON") || message.includes("no JSON")) {
      return NextResponse.json({ error: "AI returned malformed data — try again" }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
