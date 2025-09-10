"use client";

import { useEffect, useRef, useState } from "react";

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
  button2: { text: "View Catalogue", href: "#catalogues" },
};

export default function Page() {
  // --------- Mobile menu ----------
  const [menuOpen, setMenuOpen] = useState(false);

  // --------- Hero config from admin (/api/hero) ----------
  const [cfg, setCfg] = useState<HeroConfig>(DEFAULT_CFG);
  const [imgVersion, setImgVersion] = useState<number>(Date.now());

  const fetchJson = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
    if (!ct.includes("application/json")) throw new Error("API did not return JSON:\n" + text.slice(0, 200));
    return JSON.parse(text);
  };

  const loadHero = async () => {
    try {
      const data = await fetchJson("/api/hero");

      // Backward compatibility: if admin provides heroImage only
      const slides: Slide[] = Array.isArray(data?.slides)
        ? data.slides
        : data?.heroImage
        ? [{ src: data.heroImage }]
        : [];

      const merged: HeroConfig = {
        title: typeof data?.title === "string" ? data.title : DEFAULT_CFG.title,
        subtitle: typeof data?.subtitle === "string" ? data.subtitle : DEFAULT_CFG.subtitle,
        slides,
        button1: { ...DEFAULT_CFG.button1, ...(data?.button1 || {}) },
        button2: { ...DEFAULT_CFG.button2, ...(data?.button2 || {}) },
      };
      setCfg(merged);
      setImgVersion(Date.now()); // cache-bust <img>
    } catch {
      // keep defaults
      setCfg((p) => ({ ...DEFAULT_CFG, slides: p.slides.length ? p.slides : DEFAULT_CFG.slides }));
    }
  };

  useEffect(() => {
    loadHero();
  }, []);

  // Refetch when returning from /admin/hero
  useEffect(() => {
    const onFocus = () => loadHero();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Listen to admin broadcast
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "hero-updated") loadHero();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // --------- Horizontal carousels (products/services) ----------
  const scrollByStep = (query: string, dir: number) => {
    const track = document.querySelector<HTMLElement>(query);
    if (!track) return;
    const card = track.querySelector<HTMLElement>("article");
    const gap = 16;
    const step = (card?.offsetWidth || 260) + gap;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  // --------- Lead form ----------
  const formRef = useRef<HTMLFormElement | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);
  const shortId = () => "VMS-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  const onSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current!;
    let ok = true;
    const requiredInputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[name][required]");
    requiredInputs.forEach((inp) => {
      const wrap = inp.closest("label");
      const err = wrap?.querySelector<HTMLElement>(".error");
      let valid = inp.value.trim().length > 0;
      if (inp.getAttribute("name") === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value);
      if (inp.getAttribute("name") === "phone") valid = /[0-9]{8,}/.test(inp.value.replace(/\D/g, ""));
      if (!valid) ok = false;
      if (err) err?.classList.toggle("hidden", valid);
    });
    if (!ok) return;
    if (alertRef.current) {
      alertRef.current.textContent = `Thanks! Ticket ${shortId()} created. We will contact you shortly.`;
      alertRef.current.classList.remove("hidden");
    }
    form.reset();
  };

  // --------- Chips (marquee) ----------
  const chips = ["Ports", "24×7", "SOLAS", "Partners", "Ready stock", "Ports", "24×7"];
  const marqueeChips = [...chips, ...chips];

  // --------- HERO background slides (manual + AUTO scroll) ----------
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const scrollHero = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth; // one viewport width
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const scrollToIndex = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth;
    el.scrollTo({ left: i * step, behavior: "smooth" });
  };

  // keep heroIndex in sync with scroll
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      setHeroIndex(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // realign on resize so dots/arrows stay correct
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onResize = () => {
      const w = el.clientWidth;
      el.scrollTo({ left: heroIndex * w });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [heroIndex]);

  // ✅ Autoplay: start immediately on first paint, then every 6s (no pause/visibility checks)
  useEffect(() => {
    const el = trackRef.current;
    const total = cfg.slides?.length ?? 0;
    if (!el || total < 2) return;

    const stepOnce = () => {
      const w = el.clientWidth || 1;
      const current = Math.round(el.scrollLeft / w);
      const next = (current + 1) % total;
      el.scrollTo({ left: next * w, behavior: "smooth" });
    };

    // Kick immediately
    const rafId = requestAnimationFrame(stepOnce);

    // Then every 6s
    const intervalId = setInterval(stepOnce, 6000);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(intervalId);
    };
  }, [cfg.slides.length]);

  return (
    <>
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-2 focus:left-2 bg-[#4fc3f7] text-[#0a1a2f] px-3 py-2 rounded"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 h-24 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-20 h-12 rounded-xl bg-[#0a1a2f] grid place-items-center text-white font-semibold">VMS</div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-white bg-[#1f4e79] px-3 py-1 rounded-full text-xs">ISO 9001:2015</span>
              <span className="text-white bg-[#1f4e79] px-3 py-1 rounded-full text-xs">Indian Navy Vendor</span>
            </div>
          </div>
          <nav aria-label="Primary" className="hidden lg:flex ml-auto items-center gap-6 text-[15px]">
            {[
              ["#about", "About"],
              ["#products", "Products"],
              ["#services", "Services"],
              ["#ports", "Ports"],
              ["#catalogues", "Catalogues"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-[#1f4e79] focus-visible:outline focus-visible:outline-[#4fc3f7] rounded">
                {label}
              </a>
            ))}
            <a
              className="inline-flex items-center gap-2 text-white bg-[#2d6da3] hover:bg-[#1f4e79] px-4 py-2 rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,.06)] focus-visible:outline focus-visible:outline-[#4fc3f7]"
              href="#cta"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="-ml-1">
                <path d="M2 5l10 7L22 5v14H2z" stroke="currentColor" strokeWidth="2" />
              </svg>
              Contact
            </a>
          </nav>
          <button
            className="lg:hidden ml-auto p-2 rounded focus-visible:outline-2 focus-visible:outline-[#4fc3f7]"
            aria-expanded={menuOpen}
            aria-controls="mnav"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
        <div className={`border-t border-gray-100 bg-white lg:hidden ${menuOpen ? "" : "hidden"}`}>
          <div id="mnav" className="mx-auto max-w-[1200px] px-4 md:px-6 py-3 grid gap-2">
            {[
              ["#about", "About"],
              ["#products", "Products"],
              ["#services", "Services"],
              ["#ports", "Ports"],
              ["#catalogues", "Catalogues"],
              ["#cta", "Contact"],
            ].map(([href, label]) => (
              <a key={href} className="py-2" href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <main id="main">
        {/* HERO — centered content, background is a scrollable slides track */}
        <section className="relative text-white">
          <div className="relative h-[70vh] min-h-[520px]">
            {/* Background slides */}
            <div
              ref={trackRef}
              className="absolute inset-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hidden"
            >
              <div className="flex h-full w-max">
                {(cfg.slides.length ? cfg.slides : [{ src: "" }]).map((s, i) => (
                  <div key={(s.src || "gradient") + i} className="snap-start shrink-0 w-[100vw] h-full relative">
                    {cfg.slides.length === 0 ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a2f] to-[#1f4e79]" />
                        <div className="absolute inset-0 [background:radial-gradient(60%_60%_at_70%_20%,rgba(255,255,255,.10),transparent)]" />
                      </>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${s.src}?v=${imgVersion}`}
                          alt={s.alt || `Slide ${i + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Lighter overlay so image stays visible */}
                        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(10,26,47,.55),rgba(31,78,121,.35))]" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Copy & CTAs (centered) */}
            <div className="relative z-10 h-full grid place-items-center">
              <div className="mx-auto max-w-[1200px] px-4 md:px-6 text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">{cfg.title}</h1>
                <p className="mt-4 text-white/90 text-base md:text-lg max-w-3xl mx-auto">{cfg.subtitle}</p>

                <div className="mt-8 flex items-center justify-center gap-3">
                  {cfg.button1?.text && (
                    <a
                      href={cfg.button1.href || "#"}
                      className="inline-flex items-center gap-2 bg-[#2d6da3] hover:bg-[#1f4e79] text-white px-5 py-3 rounded-[12px] shadow-[0_4px_10px_rgba(0,0,0,.10)] focus-visible:outline focus-visible:outline-[#4fc3f7]"
                    >
                      {cfg.button1.text}
                    </a>
                  )}
                  {cfg.button2?.text && (
                    <a
                      href={cfg.button2.href || "#"}
                      className="inline-flex items-center gap-2 bg-white text-[#0a1a2f] hover:bg-gray-50 px-5 py-3 rounded-[12px] border border-gray-100 focus-visible:outline focus-visible:outline-[#4fc3f7]"
                    >
                      {cfg.button2.text}
                    </a>
                  )}
                </div>

                {/* Dots + arrows (only if multiple slides) */}
                {cfg.slides.length > 1 && (
                  <>
                    <div className="mt-6 flex items-center justify-center gap-2">
                      {cfg.slides.map((_, j) => (
                        <button
                          key={j}
                          aria-label={`Go to slide ${j + 1}`}
                          onClick={() => scrollToIndex(j)}
                          className={`h-2.5 w-2.5 rounded-full ${j === heroIndex ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center p-3">
                      <button
                        onClick={() => scrollHero(-1)}
                        className="pointer-events-auto p-2 rounded bg-white/10 hover:bg-white/20 focus-visible:outline focus-visible:outline-[#4fc3f7]"
                        aria-label="Previous slide"
                      >
                        ◀
                      </button>
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center p-3">
                      <button
                        onClick={() => scrollHero(1)}
                        className="pointer-events-auto p-2 rounded bg-white/10 hover:bg-white/20 focus-visible:outline focus-visible:outline-[#4fc3f7]"
                        aria-label="Next slide"
                      >
                        ▶
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CHIPS MARQUEE (right → left) */}
        <section className="bg-white border-y">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 relative h-12">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
            <div className="vms-ticker h-full flex items-center">
              <div className="vms-track">
                {marqueeChips.map((t, i) => (
                  <span key={`${t}-${i}`} className="mx-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-[#0a1a2f]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section id="about" className="py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 grid gap-10 md:grid-cols-2 items-start">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-2 text-[#13294b]">Lorem ipsum dolor sit amet</h2>
              <p className="text-sm md:text-base leading-7 text-[#0a1a2f]/80">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer facilisis, lorem non rutrum dictum, urna magna
                faucibus ante, at scelerisque sapien sapien a velit. Sed vitae lorem at enim luctus gravida.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 content-start">
              <span className="bg-[#1f4e79] text-white text-sm px-3 py-2 rounded-[12px]">ISO 9001:2015</span>
              <span className="bg-[#1f4e79] text-white text-sm px-3 py-2 rounded-[12px]">Indian Navy Vendor</span>
              <span className="bg-[#3BAFDA] text-[#0a1a2f] text-sm px-3 py-2 rounded-[12px]">24×7 • All Indian Ports</span>
              <span className="bg-[#3BAFDA] text-[#0a1a2f] text-sm px-3 py-2 rounded-[12px]">UAE • Oman Partners</span>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="py-16 lg:py-20">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <div className="flex items-end justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-[#13294b]">Products — scroll-snap — 2×2 image blocks ×14</h3>
              <div className="text-xs text-[#0a1a2f]/70">Manual scroll • inertial</div>
            </div>

            <div className="relative">
              <div
                id="prodTrack"
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hidden scroll-pl-6 scroll-pr-6 motion-safe:scroll-smooth"
                role="list"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <article
                    key={i}
                    className="snap-start shrink-0 w-[260px] bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,.06)] hover:shadow-[0_8px_18px_rgba(0,0,0,.14)] transition hover:scale-[1.02] focus-within:ring-2 ring-[#4fc3f7]"
                    role="article"
                    tabIndex={-1}
                  >
                    <div className="grid grid-cols-2 gap-1 aspect-[4/3] p-2">
                      <div className="rounded bg-[#E6F0FA]" />
                      <div className="rounded bg-[#D2E6F5]" />
                      <div className="rounded bg-[#EBF5FF]" />
                      <div className="rounded bg-[#DCEBFA]" />
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-[#0a1a2f] text-sm">Lorem ipsum</h4>
                      <p className="text-xs text-[#0a1a2f]/70 mt-1">Lorem ipsum dolor sit amet elit sed do.</p>
                      <button className="mt-3 text-[#2d6da3] text-sm underline underline-offset-2">→ lorem</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => scrollByStep("#prodTrack", -1)} className="px-3 py-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100">
                    ◀
                  </button>
                  <button onClick={() => scrollByStep("#prodTrack", 1)} className="px-3 py-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100">
                    ▶
                  </button>
                </div>
                <span className="text-xs text-[#0a1a2f]/70">Card 248–280 px • snap-start</span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
            </div>
          </div>
        </section>

        {/* Services band */}
        <section id="services" className="py-16 bg-[#ECF2F6]">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <div className="flex items-end justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-[#13294b]">Technical Services — scroll-snap — 2×2 image blocks ×12</h3>
              <div className="text-xs text-[#0a1a2f]/70">Manual scroll • inertial</div>
            </div>

            <div className="relative">
              <div
                id="svcTrack"
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hidden scroll-pl-6 scroll-pr-6 motion-safe:scroll-smooth"
                role="list"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <article
                    key={i}
                    className="snap-start shrink-0 w-[260px] bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,.06)] hover:shadow-[0_8px_18px_rgba(0,0,0,.14)] transition hover:scale-[1.02]"
                    role="article"
                  >
                    <div className="grid grid-cols-2 gap-1 aspect-[4/3] p-2">
                      <div className="rounded bg-[#E6F0FA]" />
                      <div className="rounded bg-[#D2E6F5]" />
                      <div className="rounded bg-[#EBF5FF]" />
                      <div className="rounded bg-[#DCEBFA]" />
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-[#0a1a2f] text-sm">Lorem ipsum</h4>
                      <p className="text-xs text-[#0a1a2f]/70 mt-1">Lorem ipsum dolor sit amet elit sed do.</p>
                      <button className="mt-3 text-[#2d6da3] text-sm underline underline-offset-2">→ lorem</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => scrollByStep("#svcTrack", -1)} className="px-3 py-2 rounded bg-white hover:bg-gray-50 border border-gray-100">
                    ◀
                  </button>
                  <button onClick={() => scrollByStep("#svcTrack", 1)} className="px-3 py-2 rounded bg-white hover:bg-gray-50 border border-gray-100">
                    ▶
                  </button>
                </div>
                <span className="text-xs text-[#0a1a2f]/70">Keyboard focusable</span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
            </div>
          </div>
        </section>

        {/* VM/CV/Principles */}
        <section className="py-12">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,.06)] hover:shadow-[0_4px_10px_rgba(0,0,0,.10)] transition">
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100" />
                <p className="mt-4 text-[#0a1a2f]/80 text-sm leading-6">
                  Lorem ipsum dolor sit amet, consectetur elit. Sed do eiusmod tempor incididunt.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="py-20 relative">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#E3F2F7,#FFFFFF)]" />
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 grid lg:grid-cols-[1fr_320px] gap-6">
            <form ref={formRef} noValidate onSubmit={onSubmitLead} className="bg-white/95 rounded-2xl p-6 md:p-8 shadow-[0_8px_18px_rgba(0,0,0,.14)]">
              <h3 className="text-lg md:text-2xl font-semibold text-[#13294b]">Tell us what you need at your next port</h3>
              <p className="mt-1 text-sm text-[#0a1a2f]/70">We’ll respond within business hours with availability and ETA.</p>
              <div ref={alertRef} className="hidden mt-4 p-3 rounded bg-green-50 text-green-800 text-sm" />
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <label className="grid gap-1 text-sm">
                  Full Name<span className="sr-only">required</span>
                  <input required name="name" className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]" />
                  <span className="error text-xs text-red-600 hidden">This field is required.</span>
                </label>
                <label className="grid gap-1 text-sm">
                  Company
                  <input name="company" className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]" />
                </label>
                <label className="grid gap-1 text-sm">
                  Email
                  <input required name="email" type="email" className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]" />
                  <span className="error text-xs text-red-600 hidden">Enter a valid email.</span>
                </label>
                <label className="grid gap-1 text-sm">
                  Phone/WhatsApp
                  <input required name="phone" inputMode="tel" className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]" placeholder="+91 00000 00000" />
                  <span className="error text-xs text-red-600 hidden">Include country/area code.</span>
                </label>
                <label className="grid gap-1 text-sm">
                  Port/Location
                  <input name="port" className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]" placeholder="Chennai, Mumbai, ..." />
                </label>
                <label className="grid gap-1 text-sm">
                  Service Category
                  <select name="category" className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]">
                    <option>Products</option>
                    <option>Technical Services</option>
                    <option>HVAC & Refrigeration</option>
                    <option>LSA/FFA</option>
                    <option>Calibration</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-sm mt-4">
                Message
                <textarea name="message" rows={4} className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]" />
              </label>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="submit" className="inline-flex items-center gap-2 bg-[#2d6da3] hover:bg-[#1f4e79] text-white px-5 py-3 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,.10)] focus-visible:outline focus-visible:outline-[#4fc3f7]">
                  Submit
                </button>
                <span className="text-xs text-[#0a1a2f]/70">ISO 9001:2015 • Indian Navy Vendor</span>
              </div>
            </form>
            <aside className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h4 className="font-semibold text-[#13294b]">Testimonials / Logos</h4>
              <div className="mt-2 grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-white border border-gray-100" />
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* Goa Paints Banner */}
        <section id="catalogues" className="py-14 relative text-white">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#13294b,#1f4e79)]" />
          <div className="relative mx-auto max-w-[1200px] px-4 md:px-6 flex items-center justify-between">
            <p className="text-base md:text-lg">Authorized Distributor — Goa Paints • ROHS/REACH • VOC • Lead/Chrome-free</p>
            <span className="text-xs opacity-80">Performance: LCP≤2.5s • CLS≤0.1 • INP≤200ms</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-white py-16 bg-gradient-to-b from-[#0E3857] to-[#0B2C48]">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 grid md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div><div className="font-semibold mb-2">About</div><div className="text-white/80 text-sm">Lorem ipsum dolor sit amet.</div></div>
          <div><div className="font-semibold mb-2">Links</div><div className="text-white/80 text-sm">Lorem ipsum dolor sit.</div></div>
          <div><div className="font-semibold mb-2">Catalogues</div><div className="text-white/80 text-sm">Lorem ipsum dolor sit.</div></div>
          <div id="ports"><div className="font-semibold mb-2">Ports</div><div className="text-white/80 text-sm">India • UAE • Oman</div></div>
          <div><div className="font-semibold mb-2">Contact</div><div className="text-white/80 text-sm">+91 • info@...</div></div>
          <div><div className="font-semibold mb-2">Social</div><div className="text-white/80 text-sm">LinkedIn • Instagram</div></div>
        </div>
        <div className="mt-6 border-t border-white/10">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-4 text-sm text-white/80 flex flex-wrap gap-3 items-center justify-between">
            <span>© VMS • Powered by COYOTECH • Policies</span>
            <span>24×7 — All Indian Ports</span>
          </div>
        </div>
      </footer>

      {/* Global helpers & marquee CSS */}
      <style jsx global>{`
        .scrollbar-hidden::-webkit-scrollbar { display: none; }
        .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }

        /* marquee */
        .vms-ticker { overflow: hidden; position: relative; }
        .vms-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          animation: vms-marquee 10s linear infinite;
          animation-delay: 0s;
          animation-play-state: running;
          will-change: transform;
        }
        .vms-ticker:hover .vms-track { animation-play-state: paused; }
        @keyframes vms-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
