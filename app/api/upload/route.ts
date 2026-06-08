import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin, MEDIA_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

async function ensureBucket() {
  const { data: existing, error: getErr } = await supabaseAdmin.storage.getBucket(MEDIA_BUCKET);
  if (existing) return;

  console.log("[upload] bucket not found, attempting create. getBucket error:", getErr?.message);

  const { error: createErr } = await supabaseAdmin.storage.createBucket(MEDIA_BUCKET, {
    public: true,
  });

  if (createErr) {
    console.error("[upload] createBucket error:", createErr.message);
    const msg = createErr.message.toLowerCase();
    if (!msg.includes("already exists") && !msg.includes("duplicate")) {
      throw new Error(`Cannot create storage bucket: ${createErr.message}`);
    }
  } else {
    console.log("[upload] bucket created successfully");
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureBucket();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only images and videos are allowed" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const maxBytes = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large (max ${isVideo ? "500 MB" : "10 MB"})` },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const folder = isVideo ? "videos" : "images";
    const path = `${session.user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error("[upload] storage error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("[upload POST]", err);
    return NextResponse.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
