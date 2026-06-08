import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULT_SECTIONS = [
  { type: "hero",         visible: true,  order: 0,  content: { tagline: "", ctaPrimary: "Hire Me", ctaSecondary: "View Work", photoShape: "rounded", photoSize: "xl" } },
  { type: "about",        visible: true,  order: 1,  content: { bio: "" } },
  { type: "skills",       visible: true,  order: 2,  content: { items: [] } },
  { type: "projects",     visible: true,  order: 3,  content: { items: [] } },
  { type: "gallery",      visible: false, order: 4,  content: { items: [], layout: "grid", columns: 3, imageHeight: "square" } },
  { type: "showreel",     visible: false, order: 5,  content: { reels: [], layout: "side-by-side", aspectRatio: "16:9" } },
  { type: "timeline",     visible: false, order: 6,  content: { items: [] } },
  { type: "testimonials", visible: false, order: 7,  content: { items: [] } },
  { type: "contact",      visible: true,  order: 8,  content: { email: "", message: "Let's work together!", showForm: true } },
  { type: "store",        visible: false, order: 9,  content: {} },
  { type: "campaigns",    visible: false, order: 10, content: {} },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let portfolio = await db.portfolio.findUnique({
    where: { userId: session.user.id },
    include: { sections: { orderBy: { order: "asc" } } },
    // canvasData is selected automatically (not in include)
  });

  if (!portfolio) {
    portfolio = await db.portfolio.create({
      data: {
        userId: session.user.id,
        template: "minimal",
        primaryColor: "#29abe2",
        published: false,
        sections: { create: DEFAULT_SECTIONS },
      },
      include: { sections: { orderBy: { order: "asc" } } },
    });
  }

  return NextResponse.json(portfolio);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, template, primaryColor, seoTitle, seoDesc, settings, canvasData } = body;

    const portfolio = await db.portfolio.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        title,
        description,
        template: template ?? "canvas",
        primaryColor: primaryColor ?? "#29abe2",
        seoTitle,
        seoDesc,
        settings: settings ?? {},
        canvasData: canvasData ?? null,
        sections: { create: DEFAULT_SECTIONS },
      },
      update: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(template !== undefined && { template }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDesc !== undefined && { seoDesc }),
        ...(settings !== undefined && { settings }),
        ...(canvasData !== undefined && { canvasData }),
      },
      include: { sections: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error("[portfolio PUT]", err);
    return NextResponse.json({ error: "Failed to save portfolio" }, { status: 500 });
  }
}
