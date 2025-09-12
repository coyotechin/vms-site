import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Only image files are allowed" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "File size must be less than 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const filename = `${Date.now()}-${safe}`;
    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, buffer);

    const src = `/uploads/${filename}`;
    return NextResponse.json({ ok: true, src }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Upload failed" }, { status: 500 });
  }
}