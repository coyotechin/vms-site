"use client";

import { Key, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Slide = { src: string; alt?: string };
type Card = { 
  title: string; 
  desc: string; 
  alt: string; 
  images: string[] 
};

type SlideType = "products" | "technicalServices";

type HeroConfig = {
  title: string;
  subtitle: string;

  slides: Slide[];
  products: Card[];
  technicalServices: Card[];

  button1: { text: string; href: string };
  button2: { text: string; href: string };
};

const DEFAULT_CFG: HeroConfig = {
  title: "Lorem ipsum dolor sit amet consectetur.",
  subtitle:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",

  slides: [],
  products: [],
  technicalServices: [],

  button1: { text: "Get Quote", href: "#cta" },
  button2: { text: "View Catalogue", href: "#catalogues" },
};

export default function AdminHeroPage() {
  const router = useRouter();

  const [cfg, setCfg] = useState<HeroConfig>(DEFAULT_CFG);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // (Optional) simple guard for the demo
  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("role");
    const legacyAdmin = localStorage.getItem("isAdmin") === "true";
    if (role !== "admin" && !legacyAdmin) {
      router.replace("/login");
    }
  }, [router]);

  const logout = () => {
    try {
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      localStorage.removeItem("isAdmin"); // legacy flag
    } catch {}
    router.push("/login");
  };

  const fetchJson = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
    if (!ct.includes("application/json"))
      throw new Error("API did not return JSON:\n" + text.slice(0, 200));
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
          products: Array.isArray(data?.products) ? data.products : [],
          technicalServices: Array.isArray(data?.technicalServices)
            ? data.technicalServices
            : [],
          button1: { ...DEFAULT_CFG.button1, ...(data?.button1 || {}) },
          button2: { ...DEFAULT_CFG.button2, ...(data?.button2 || {}) },
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

  const move = (i: number, dir: -1 | 1) => {
    setCfg((p) => {
      const arr = [...p.slides];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, slides: arr };
    });
  };

  const updateAlt = (i: number, alt: string) =>
    setCfg((p) => {
      const arr = [...p.slides];
      arr[i] = { ...arr[i], alt };
      return { ...p, slides: arr };
    });

  const updateCard = (i: number, type: SlideType, field: keyof Card, value: string) => {
    setCfg((p) => {
      const arr = [...p[type]];
      arr[i] = { ...arr[i], [field]: value };
      return { ...p, [type]: arr };
    });
  };

  const removeImage = (type: SlideType, cardIndex: number, imgIndex: number) => {
    setCfg((p) => {
      const arr = [...p[type]];
      arr[cardIndex] = {
        ...arr[cardIndex],
        images: arr[cardIndex].images.filter((_, i) => i !== imgIndex)
      };
      return { ...p, [type]: arr };
    });
  };

  const moveCard = (i: number, dir: -1 | 1, type: SlideType) => {
    setCfg((p) => {
      const arr = [...p[type]];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, [type]: arr };
    });
  };

  const uploadCardImages = async (files: FileList | null, type: SlideType, cardIndex: number) => {
    if (!files || !files.length) return;
    try {
      const newImages: string[] = [];
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/hero/upload", { method: "POST", body: fd });
        const data = await res.json().catch(async () => {
          throw new Error(await res.text());
        });
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Upload failed");
        newImages.push(data.src);
      }
      
      setCfg((p) => {
        const arr = [...p[type]];
        arr[cardIndex] = {
          ...arr[cardIndex],
          images: [...arr[cardIndex].images, ...newImages]
        };
        return { ...p, [type]: arr };
      });
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    }
  };

  const removeCard = (type: SlideType, i: number) => {
    setCfg((p) => ({ 
      ...p, 
      [type]: p[type].filter((_, j) => j !== i) 
    }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json().catch(async () => {
        throw new Error(await res.text());
      });
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Save failed");

      localStorage.setItem("hero-updated", Date.now().toString());
      window.dispatchEvent(new Event("storage"));
      alert("Saved! Changes will be reflected on the home page.");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white text-black min-h-screen">
      <main className="mx-auto max-w-[1100px] p-6 bg-white min-h-screen">
        {/* Top bar with Logout */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Hero Admin</h1>
            <p className="text-sm text-gray-600">
              Upload / reorder slides and edit the hero texts & buttons.
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
            aria-label="Logout"
            title="Logout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" />
              <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" />
              <path d="M15 12H3" stroke="currentColor" strokeWidth="2" />
            </svg>
            Logout
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded bg-red-50 text-red-700 px-3 py-2 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}

        {/* Hero text */}
        <section className="mt-6 space-y-4">
          <h2 className="font-semibold text-black">Hero Text</h2>
          <label className="grid gap-1 text-sm text-black">
            Title (big line)
            <input
              value={cfg.title}
              onChange={(e) => setCfg((p) => ({ ...p, title: e.target.value }))}
              className="rounded-md border px-3 py-2 text-black bg-white"
            />
          </label>
          <label className="grid gap-1 text-sm text-black">
            Subtitle (small line)
            <textarea
              rows={3}
              value={cfg.subtitle}
              onChange={(e) => setCfg((p) => ({ ...p, subtitle: e.target.value }))}
              className="rounded-md border px-3 py-2 text-black bg-white"
            />
          </label>
        </section>

        {/* Slides */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-black">Slides</h2>
            <label className="inline-flex items-center gap-2 text-sm rounded bg-slate-900 text-white px-3 py-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => uploadFiles(e.target.files)}
              />
              {uploading ? "Uploading..." : "Add images"}
            </label>
          </div>

          {cfg.slides.length === 0 && (
            <div className="mt-3 text-sm text-gray-500">
              No slides yet — upload some images.
            </div>
          )}

          <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cfg.slides.map((s, i) => (
              <li key={s.src} className="rounded border border-slate-200 overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.alt || `Slide ${i + 1}`} className="w-full h-40 object-cover" />
                <div className="p-2 space-y-2">
                  <input
                    placeholder="Alt text (optional)"
                    value={s.alt || ""}
                    onChange={(e) => updateAlt(i, e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm text-black bg-white"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600 truncate">{s.src}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => move(i, -1)} className="px-2 py-1 text-xs rounded bg-slate-100 text-black">
                        ←
                      </button>
                      <button onClick={() => move(i, 1)} className="px-2 py-1 text-xs rounded bg-slate-100 text-black">
                        →
                      </button>
                      <button onClick={() => removeAt(i)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Products + Services */}
        {(["products", "technicalServices"] as SlideType[]).map((type) => (
          <section key={type} className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold capitalize text-black">
                {type === "products" ? "Products" : "Technical Services"}
              </h2>
              <button
                onClick={() =>
                  setCfg((p) => ({
                    ...p,
                    [type]: [
                      ...p[type],
                      { title: "", desc: "", alt: "", images: [] },
                    ],
                  }))
                }
                className="text-sm rounded bg-green-100 px-3 py-2 text-green-700"
              >
                Add Card
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              {cfg[type].map((s, i) => (
                <article
                  key={i}
                  className="w-[280px] bg-white rounded-xl border border-gray-100 shadow-sm p-3"
                >
                  <div className="space-y-2">
                    <input
                      placeholder="Title"
                      value={s.title || ""}
                      onChange={(e) => updateCard(i, type, "title", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 text-sm"
                    />
                    <textarea
                      placeholder="Description"
                      value={s.desc || ""}
                      onChange={(e) => updateCard(i, type, "desc", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 text-sm"
                    />
                    <input
                      placeholder="Alt text"
                      value={s.alt || ""}
                      onChange={(e) => updateCard(i, type, "alt", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 text-sm"
                    />
                  </div>

                  {/* Upload Images */}
                  <div className="mt-3">
                    <label className="inline-flex items-center gap-2 text-sm rounded bg-slate-900 text-white px-3 py-2 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => uploadCardImages(e.target.files, type, i)}
                      />
                      Add Images
                    </label>
                  </div>

                  {/* Image previews */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {s.images.map((img, imgIndex) => (
                      <div key={imgIndex} className="relative">
                        <img
                          src={img}
                          alt=""
                          className="w-20 h-20 object-cover rounded"
                        />
                        <button
                          onClick={() => removeImage(type, i, imgIndex)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveCard(i, -1, type)}
                        className="px-2 py-1 text-xs rounded bg-slate-100 text-black"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => moveCard(i, 1, type)}
                        className="px-2 py-1 text-xs rounded bg-slate-100 text-black"
                      >
                        →
                      </button>
                    </div>
                    <button
                      onClick={() => removeCard(type, i)}
                      className="px-2 py-1 text-xs rounded bg-red-100 text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* CTA Buttons */}
        <section className="mt-8">
          <h2 className="font-semibold text-black">CTA Buttons</h2>
          <div className="mt-3 grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm text-black">
              Button 1 text
              <input
                value={cfg.button1.text}
                onChange={(e) =>
                  setCfg((p) => ({ ...p, button1: { ...p.button1, text: e.target.value } }))
                }
                className="rounded-md border px-3 py-2 text-black bg-white"
              />
            </label>
            <label className="grid gap-1 text-sm text-black">
              Button 1 link
              <input
                value={cfg.button1.href}
                onChange={(e) =>
                  setCfg((p) => ({ ...p, button1: { ...p.button1, href: e.target.value } }))
                }
                className="rounded-md border px-3 py-2 text-black bg-white"
              />
            </label>
            <label className="grid gap-1 text-sm text-black">
              Button 2 text
              <input
                value={cfg.button2.text}
                onChange={(e) =>
                  setCfg((p) => ({ ...p, button2: { ...p.button2, text: e.target.value } }))
                }
                className="rounded-md border px-3 py-2 text-black bg-white"
              />
            </label>
            <label className="grid gap-1 text-sm text-black">
              Button 2 link
              <input
                value={cfg.button2.href}
                onChange={(e) =>
                  setCfg((p) => ({ ...p, button2: { ...p.button2, href: e.target.value } }))
                }
                className="rounded-md border px-3 py-2 text-black bg-white"
              />
            </label>
          </div>
        </section>

        <div className="mt-8">
          <button
            onClick={save}
            disabled={saving}
            className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </main>
    </div>
  );
}