"use client";

import { useEffect, useState } from "react";

type Slide = { src: string; alt?: string };
type HeroConfig = {
  title: string;
  subtitle: string;
  slides: Slide[];
  button1: { text: string; href: string };
  button2: { text: string; href: string };
};

const DEFAULT_CFG: HeroConfig = {
  title: "Lorem ipsum dolor sit amet consectetur.",
  subtitle:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  slides: [],
  button1: { text: "Get Quote", href: "#cta" },
  button2: { text: "View Catalogue", href: "#catalogues" }
};

export default function AdminHeroPage() {
  const [cfg, setCfg] = useState<HeroConfig>(DEFAULT_CFG);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJson = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
    if (!ct.includes("application/json")) throw new Error("API did not return JSON:\n" + text.slice(0, 200));
    return JSON.parse(text);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson("/api/hero");
        const merged: HeroConfig = {
          title: typeof data?.title === "string" ? data.title : DEFAULT_CFG.title,
          subtitle: typeof data?.subtitle === "string" ? data.subtitle : DEFAULT_CFG.subtitle,
          slides: Array.isArray(data?.slides) ? data.slides : [],
          button1: { ...DEFAULT_CFG.button1, ...(data?.button1 || {}) },
          button2: { ...DEFAULT_CFG.button2, ...(data?.button2 || {}) }
        };
        setCfg(merged);
      } catch (e: any) {
        setError(e?.message || "Failed to load config");
        setCfg(DEFAULT_CFG);
      }
    })();
  }, []);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    setError(null);
    try {
      const newSlides: Slide[] = [];
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/hero/upload", { method: "POST", body: fd });
        const data = await res.json().catch(async () => {
          throw new Error(await res.text());
        });
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Upload failed");
        newSlides.push({ src: data.src, alt: f.name });
      }
      setCfg((p) => ({ ...p, slides: [...p.slides, ...newSlides] }));
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i: number) =>
    setCfg((p) => ({ ...p, slides: p.slides.filter((_, j) => j !== i) }));

  const move = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const arr = [...p.slides];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, slides: arr };
    });

  const updateAlt = (i: number, alt: string) =>
    setCfg((p) => {
      const arr = [...p.slides];
      arr[i] = { ...arr[i], alt };
      return { ...p, slides: arr };
    });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg)
      });
      const data = await res.json().catch(async () => {
        throw new Error(await res.text());
      });
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Save failed");
      localStorage.setItem("hero-updated", Date.now().toString()); // notify homepage
      alert("Saved!");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1100px] p-6">
      <h1 className="text-2xl font-bold">Hero Admin</h1>
      <p className="text-sm text-slate-600">Upload / reorder slides and edit the hero texts & buttons.</p>

      {error && <div className="mt-4 rounded bg-red-50 text-red-700 px-3 py-2 text-sm whitespace-pre-wrap">{error}</div>}

      {/* Hero text */}
      <section className="mt-6 space-y-4">
        <h2 className="font-semibold">Hero Text</h2>
        <label className="grid gap-1 text-sm">
          Title (big line)
          <input
            value={cfg.title}
            onChange={(e) => setCfg((p) => ({ ...p, title: e.target.value }))}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Subtitle (small line)
          <textarea
            rows={3}
            value={cfg.subtitle}
            onChange={(e) => setCfg((p) => ({ ...p, subtitle: e.target.value }))}
            className="rounded-md border px-3 py-2"
          />
        </label>
      </section>

      {/* Slides */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Slides</h2>
          <label className="inline-flex items-center gap-2 text-sm rounded bg-slate-900 text-white px-3 py-2 cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
            {uploading ? "Uploading..." : "Add images"}
          </label>
        </div>

        {cfg.slides.length === 0 && (
          <div className="mt-3 text-sm text-slate-500">No slides yet — upload some images.</div>
        )}

        <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cfg.slides.map((s, i) => (
            <li key={s.src} className="rounded border border-slate-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt || `Slide ${i + 1}`} className="w-full h-40 object-cover" />
              <div className="p-2 space-y-2">
                <input
                  placeholder="Alt text (optional)"
                  value={s.alt || ""}
                  onChange={(e) => updateAlt(i, e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600 truncate">{s.src}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => move(i, -1)} className="px-2 py-1 text-xs rounded bg-slate-100">←</button>
                    <button onClick={() => move(i, 1)} className="px-2 py-1 text-xs rounded bg-slate-100">→</button>
                    <button onClick={() => removeAt(i)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA Buttons */}
      <section className="mt-8">
        <h2 className="font-semibold">CTA Buttons</h2>
        <div className="mt-3 grid sm:grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            Button 1 text
            <input
              value={cfg.button1.text}
              onChange={(e) => setCfg((p) => ({ ...p, button1: { ...p.button1, text: e.target.value } }))}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Button 1 link
            <input
              value={cfg.button1.href}
              onChange={(e) => setCfg((p) => ({ ...p, button1: { ...p.button1, href: e.target.value } }))}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Button 2 text
            <input
              value={cfg.button2.text}
              onChange={(e) => setCfg((p) => ({ ...p, button2: { ...p.button2, text: e.target.value } }))}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Button 2 link
            <input
              value={cfg.button2.href}
              onChange={(e) => setCfg((p) => ({ ...p, button2: { ...p.button2, href: e.target.value } }))}
              className="rounded-md border px-3 py-2"
            />
          </label>
        </div>
      </section>

      <div className="mt-8">
        <button onClick={save} disabled={saving} className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </main>
  );
}
