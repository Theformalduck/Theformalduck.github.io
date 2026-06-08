import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin, MEDIA_BUCKET } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key-here") {
    return NextResponse.json(
      { error: "Storage not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local" },
      { status: 503 }
    );
  }

  try {
    const { filename, contentType } = await req.json();

    if (!contentType?.startsWith("image/") && !contentType?.startsWith("video/")) {
      return NextResponse.json({ error: "Only images and videos are allowed" }, { status: 400 });
    }

    const ext = (filename as string).split(".").pop() ?? "bin";
    const folder = contentType.startsWith("video/") ? "videos" : "images";
    const path = `${session.user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(path);

    if (error) {
      console.error("[upload/presign]", error);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl });
  } catch (err) {
    console.error("[upload/presign POST]", err);
    return NextResponse.json({ error: "Upload setup failed" }, { status: 500 });
  }
}
