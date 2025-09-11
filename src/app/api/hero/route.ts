import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // don't cache route

const DATA_PATH = path.join(process.cwd(), "data", "hero.json");

type Slide = { title?: string; desc?: string; alt?: string; images: string[] };
type HeroConfig = {
  title: string;
  subtitle: string;
  products: Slide[];
  technicalServices: Slide[];
  button1: { text: string; href: string };
  button2: { text: string; href: string };
};

const DEFAULT_CFG: HeroConfig = {
  title: "Lorem ipsum dolor sit amet consectetur.",
  subtitle:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  products: [],
  technicalServices: [],
  button1: { text: "Get Quote", href: "#cta" },
  button2: { text: "View Catalogue", href: "#catalogues" },
};

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(DEFAULT_CFG, null, 2));
  }
}

async function readCfg(): Promise<HeroConfig> {
  await ensureFile();
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const data = JSON.parse(raw);

    // Handle migration from old format to new format
    const products: Slide[] = Array.isArray(data?.products)
      ? data.products
      : [];

    const technicalServices: Slide[] = Array.isArray(data?.technicalServices)
      ? data.technicalServices
      : [];

    return {
      title: typeof data?.title === "string" ? data.title : DEFAULT_CFG.title,
      subtitle:
        typeof data?.subtitle === "string" ? data.subtitle : DEFAULT_CFG.subtitle,
      products,
      technicalServices,
      button1: {
        text: data?.button1?.text ?? DEFAULT_CFG.button1.text,
        href: data?.button1?.href ?? DEFAULT_CFG.button1.href,
      },
      button2: {
        text: data?.button2?.text ?? DEFAULT_CFG.button2.text,
        href: data?.button2?.href ?? DEFAULT_CFG.button2.href,
      },
    };
  } catch {
    return DEFAULT_CFG;
  }
}

export async function GET() {
  const cfg = await readCfg();
  return NextResponse.json(cfg, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = await readCfg();

    // Process products
    const products: Slide[] = Array.isArray(body?.products)
      ? body.products.map((p: any) => ({
          title: typeof p.title === "string" ? p.title.trim() : "",
          desc: typeof p.desc === "string" ? p.desc.trim() : "",
          alt: typeof p.alt === "string" ? p.alt.trim() : "",
          images: Array.isArray(p.images) 
            ? p.images.filter((img: any) => typeof img === "string")
            : []
        }))
      : current.products;

    // Process technical services
    const technicalServices: Slide[] = Array.isArray(body?.technicalServices)
      ? body.technicalServices.map((s: any) => ({
          title: typeof s.title === "string" ? s.title.trim() : "",
          desc: typeof s.desc === "string" ? s.desc.trim() : "",
          alt: typeof s.alt === "string" ? s.alt.trim() : "",
          images: Array.isArray(s.images) 
            ? s.images.filter((img: any) => typeof img === "string")
            : []
        }))
      : current.technicalServices;

    const next: HeroConfig = {
      title: typeof body?.title === "string" ? body.title : current.title,
      subtitle: typeof body?.subtitle === "string" ? body.subtitle : current.subtitle,
      products,
      technicalServices,
      button1: {
        text:
          typeof body?.button1?.text === "string"
            ? body.button1.text
            : current.button1.text,
        href:
          typeof body?.button1?.href === "string"
            ? body.button1.href
            : current.button1.href,
      },
      button2: {
        text:
          typeof body?.button2?.text === "string"
            ? body.button2.text
            : current.button2.text,
        href:
          typeof body?.button2?.href === "string"
            ? body.button2.href
            : current.button2.href,
      },
    };

    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(next, null, 2));

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Save failed" },
      { status: 400 }
    );
  }
}