"use client";

import Head from "next/head";
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

  // --------- Header: transparent over hero → white after scroll ----------
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --------- Hero config from admin (/api/hero) ----------
  const [cfg, setCfg] = useState<HeroConfig>(DEFAULT_CFG);
  const [imgVersion, setImgVersion] = useState<number>(Date.now());

  const fetchJson = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
    if (!ct.includes("application/json"))
      throw new Error("API did not return JSON:\n" + text.slice(0, 200));
    return JSON.parse(text);
  };

  const loadHero = async () => {
    try {
      const data = await fetchJson("/api/hero");
      const slides: Slide[] = Array.isArray(data?.slides)
        ? data.slides
        : data?.heroImage
        ? [{ src: data.heroImage }]
        : [];
      const merged: HeroConfig = {
        title: typeof data?.title === "string" ? data.title : DEFAULT_CFG.title,
        subtitle:
          typeof data?.subtitle === "string" ? data.subtitle : DEFAULT_CFG.subtitle,
        slides,
        button1: { ...DEFAULT_CFG.button1, ...(data?.button1 || {}) },
        button2: { ...DEFAULT_CFG.button2, ...(data?.button2 || {}) },
      };
      setCfg(merged);
      setImgVersion(Date.now()); // cache-bust images
    } catch {
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

  // --------- Horizontal carousels ----------
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
    const requiredInputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "[name][required]"
    );
    requiredInputs.forEach((inp) => {
      const wrap = inp.closest("label");
      const err = wrap?.querySelector<HTMLElement>(".error");
      let valid = inp.value.trim().length > 0;
      if (inp.getAttribute("name") === "email")
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value);
      if (inp.getAttribute("name") === "phone")
        valid = /[0-9]{8,}/.test(inp.value.replace(/\D/g, ""));
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

  // --------- HERO background slides (manual + AUTO scroll) ----------
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const scrollHero = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const scrollToIndex = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth;
    el.scrollTo({ left: i * step, behavior: "smooth" });
  };

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

    const rafId = requestAnimationFrame(stepOnce);
    const intervalId = setInterval(stepOnce, 6000);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(intervalId);
    };
  }, [cfg.slides.length]);

  // --------- Marquee content ----------
  const marqueeItems = [
    "Registered Supplier on the Government e-Marketplace (GeM)",
    "Approved Vendor for Ministry of Defence",
    "Authorized Distributor for GOA PAINTS Brand",
  ];
  const marqueeDup = [...marqueeItems, ...marqueeItems];

  return (
    <>
      {/* Load Roboto */}
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-2 focus:left-2 bg-[#4fc3f7] text-[#0a1a2f] px-3 py-2 rounded"
      >
        Skip to content
      </a>

      {/* Header — fixed; transparent at top over hero, solid white after scroll */}
    <header
  className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
    scrolled ? "bg-white/95 backdrop-blur shadow-sm" : "bg-transparent"
  }`}
>
  {/* Full-width row (no max-w here) */}
  <div className="grid grid-cols-[auto_1fr_auto] items-center h-24 w-full">

    {/* Logo & ISO — truly left (no container padding) */}
    {/* Logo & ISO — slight right offset */}
<div className="pl-4 sm:pl-6 md:pl-8 flex flex-col items-start gap-1">
  <a href="#home" aria-label="VMS Home" className="block">
    <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
  </a>
  <span className="px-4 py-1 rounded-full text-xs font-medium bg-[#1f4e79] text-white">
    AN ISO 9001 : 2015 CERTIFIED COMPANY
  </span>
</div>


    {/* spacer column */}
    <div />

    {/* Desktop Navigation (constrained, right-aligned) */}
    <nav
      className={`hidden lg:flex items-center gap-6 justify-end pr-4 md:pr-6 max-w-[1200px] w-full ml-auto
        ${scrolled ? "text-black" : "text-white"} transition-colors duration-300`}
    >
      <a href="#home" className="hover:text-gray-500 rounded">Home</a>
      <a href="#about" className="hover:text-gray-500 rounded">About Us</a>

      {/* Products Dropdown */}
      <div className="relative group">
        <button className="hover:text-gray-500 rounded">Products</button>
        <div className="absolute left-0 top-full mt-1 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 bg-white text-[#0a1a2f] rounded shadow-lg min-w-[220px] z-50">
          <ul className="p-2">
            {[
              "Fresh, Frozen & Dry Provisions",
              "Bonded Stores & Slop Chest",
              "IT Equipments & Accessories",
              "Deck & Engine Stores",
              "Cabin & Galley Stores",
              "Marine Spares, Lube Oil & Valves",
              "Marine Chemicals & Gases",
              "Marine Paints",
              "Electrical Stores",
              "Electronics & Navigational Supplies",
              "Medical Stores",
              "Water Treatment Systems",
              "Other Supplies",
            ].map((item) => (
              <li key={item} className="px-4 py-1 hover:bg-gray-100 rounded whitespace-nowrap">
                <a href="#products">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Technical Services Dropdown */}
      <div className="relative group">
        <button className="hover:text-gray-500 rounded">Technical Services</button>
        <div className="absolute left-0 top-full mt-1 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 bg-white text-[#0a1a2f] rounded shadow-lg min-w-[220px] z-50">
          <ul className="p-2">
            {[
              "Hull and Structure Repairs",
              "Engine and Propulsion Systems",
              "Electrical and Automation Systems",
              "Piping and Valve Systems",
              "Deck and Cargo Equipment",
              "Safety and Environmental Systems",
              "Interior and Accommodation Services",
              "Dry Docking and Survey Preparation",
              "Ship Propulsion and Performance Optimization",
              "Fleet Management and Consultancy",
              "Crew Training and Support",
              "Miscellaneous Services",
            ].map((item) => (
              <li key={item} className="px-4 py-1 hover:bg-gray-100 rounded whitespace-nowrap">
                <a href="#services">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <a href="#exports" className="hover:text-gray-500 rounded">Exports</a>
      <a href="#enquiry" className="hover:text-gray-500 rounded">Enquiry</a>
      <a href="#vendor" className="hover:text-gray-500 rounded">Vendor Registration</a>
      <a href="#cta" className="hover:text-gray-500 rounded">Contact Us</a>
    </nav>

    {/* Mobile menu toggle (right) */}
    <button
      className="lg:hidden justify-self-end p-2 mr-4 md:mr-6 rounded"
      aria-expanded={menuOpen}
      aria-controls="mnav"
      aria-label="Open menu"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
      </svg>
    </button>
  </div>

  {/* Mobile dropdown */}
  <div className={`border-t border-gray-100 bg-white lg:hidden ${menuOpen ? "" : "hidden"}`}>
    <div id="mnav" className="mx-auto max-w-[1200px] px-4 md:px-6 py-3 flex flex-col gap-2">
      <a href="#home" className="py-2" onClick={() => setMenuOpen(false)}>Home</a>
      <a href="#about" className="py-2" onClick={() => setMenuOpen(false)}>About Us</a>

      <details className="group py-2">
        <summary className="cursor-pointer select-none">Products</summary>
        <div className="pl-4 mt-1 flex flex-col gap-1">
          {[
            "Fresh, Frozen & Dry Provisions",
            "Bonded Stores & Slop Chest",
            "IT Equipments & Accessories",
            "Deck & Engine Stores",
            "Cabin & Galley Stores",
            "Marine Spares, Lube Oil & Valves",
            "Marine Chemicals & Gases",
            "Marine Paints",
            "Electrical Stores",
            "Electronics & Navigational Supplies",
            "Medical Stores",
            "Water Treatment Systems",
            "Other Supplies",
          ].map((item) => (
            <a key={item} href="#products" className="py-1 pl-2 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
        </div>
      </details>

      <details className="group py-2">
        <summary className="cursor-pointer select-none">Technical Services</summary>
        <div className="pl-4 mt-1 flex flex-col gap-1">
          {[
            "Hull and Structure Repairs",
            "Engine and Propulsion Systems",
            "Electrical and Automation Systems",
            "Piping and Valve Systems",
            "Deck and Cargo Equipment",
            "Safety and Environmental Systems",
            "Interior and Accommodation Services",
            "Dry Docking and Survey Preparation",
            "Ship Propulsion and Performance Optimization",
            "Fleet Management and Consultancy",
            "Crew Training and Support",
            "Miscellaneous Services",
          ].map((item) => (
            <a key={item} href="#services" className="py-1 pl-2 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
        </div>
      </details>

      <a href="#exports" className="py-2" onClick={() => setMenuOpen(false)}>Exports</a>
      <a href="#enquiry" className="py-2" onClick={() => setMenuOpen(false)}>Enquiry</a>
      <a href="#vendor" className="py-2" onClick={() => setMenuOpen(false)}>Vendor Registration</a>
      <a href="#cta" className="py-2" onClick={() => setMenuOpen(false)}>Contact Us</a>
    </div>
  </div>
</header>




      <main id="main">
        {/* HERO — starts at very top; header overlays it */}
        <section className="relative text-white">
          <div className="relative h-[70vh] min-h-[520px]">
            {/* Background slides (scrollable & autoplay) */}
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
                        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(10,26,47,.45),rgba(31,78,121,.30))]" />
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

        {/* FULL-WIDTH MARQUEE — Roboto, black, bigger */}
        <section className="bg-white">
  <div className="vms-ticker h-14 md:h-16 flex items-center px-4 md:px-6">
    <div className="vms-track roboto">
      {[
       "Registered Supplier on the Government e-Marketplace (GeM)",
        "Approved Vendor for Ministry of Defence",
        "Authorized Distributor for GOA PAINTS Brand",,
      ].map((item, index) => (
        <span
          key={index}
          className="text-lg md:text-xl font-medium mx-6 text-gray-600"
        >
          {item}
        </span>
      ))}
    </div>
  </div>
</section>


        {/* Intro */}
        <section id="about" className="py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 grid gap-10 md:grid-cols-2 items-start">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-2 text-[#13294b]">
                Lorem ipsum dolor sit amet
              </h2>
              <p className="text-sm md:text-base leading-7 text-[#0a1a2f]/80">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer facilisis, lorem
                non rutrum dictum, urna magna faucibus ante, at scelerisque sapien sapien a velit.
                Sed vitae lorem at enim luctus gravida.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 content-start">
             <img 
  src="/lob.png" 
  alt="About Goa Paints" 
  className="w-full h-auto rounded-[12px] object-cover relative left-50"
/>
            </div>
          </div>
        </section>
  {/* Certificate */}
<section className="relative text-white h-60 flex items-center">
  <div className="absolute inset-0 bg-[linear-gradient(120deg,#13294b,#1f4e79)]"></div>

  <div className="relative mx-auto max-w-[1200px] px-4 md:px-6 flex items-center justify-between w-full">
    {/* Left side text + button */}
    <div className="flex items-center gap-4">
      <p className="text-lg md:text-xl">Goa Paints Authorized Distributor, For more details</p>
      <a
        href="#certificate-section"
        className="flex items-center gap-2 bg-white text-[#1f4e79] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
      >
        Click here
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>

    {/* KPI image preview */}
    <div className="relative group cursor-pointer">
      <img
        src="/Certificate.jpg"
        alt="KPI Preview"
        className="w-50 h-50 object-contain rounded-lg transition-transform group-hover:scale-110"
      />
      {/* Hover preview popup */}
      <div className="absolute right-0 top-12 hidden group-hover:block z-50">
        <img
          src="/Certificate.jpg"
          alt="KPI Full Preview"
          className="w-[1600px] h-auto rounded-lg shadow-lg border border-white/20"
        />
      </div>
    </div>
  </div>
</section>

{/* Target section */}
<section
  id="certificate-section"
  className="py-20 mx-auto max-w-[1200px] px-4 md:px-6"
>
  <h2 className="text-2xl md:text-3xl font-bold text-[#13294b] mb-4">
    Certificate Details
  </h2>
  <p className="text-base md:text-lg text-[#0a1a2f]/80 leading-7">
    Here you can showcase the certificate details, information about your
    authorization, or display more images/documents related to Goa Paints.
  </p>
</section>

        {/* Products */}
        <section id="products" className="py-16 lg:py-20">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <div className="flex items-end justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-[#13294b]">
                Products — scroll-snap — 2×2 image blocks ×14
              </h3>
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
                      <p className="text-xs text-[#0a1a2f]/70 mt-1">
                        Lorem ipsum dolor sit amet elit sed do.
                      </p>
                      <button className="mt-3 text-[#2d6da3] text-sm underline underline-offset-2">
                        → lorem
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollByStep("#prodTrack", -1)}
                    className="px-3 py-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => scrollByStep("#prodTrack", 1)}
                    className="px-3 py-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100"
                  >
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

        {/* Services */}
        <section id="services" className="py-16 bg-[#ECF2F6]">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <div className="flex items-end justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-[#13294b]">
                Technical Services — scroll-snap — 2×2 image blocks ×12
              </h3>
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
                      <p className="text-xs text-[#0a1a2f]/70 mt-1">
                        Lorem ipsum dolor sit amet elit sed do.
                      </p>
                      <button className="mt-3 text-[#2d6da3] text-sm underline underline-offset-2">
                        → lorem
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollByStep("#svcTrack", -1)}
                    className="px-3 py-2 rounded bg-white hover:bg-gray-50 border border-gray-100"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => scrollByStep("#svcTrack", 1)}
                    className="px-3 py-2 rounded bg-white hover:bg-gray-50 border border-gray-100"
                  >
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

        {/* CTA */}
        <section id="cta" className="py-20 relative">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#E3F2F7,#FFFFFF)]" />
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 grid lg:grid-cols-[1fr_320px] gap-6">
            <form
              ref={formRef}
              noValidate
              onSubmit={onSubmitLead}
              className="bg-white/95 rounded-2xl p-6 md:p-8 shadow-[0_8px_18px_rgba(0,0,0,.14)]"
            >
              <h3 className="text-lg md:text-2xl font-semibold text-[#13294b]">
                Tell us what you need at your next port
              </h3>
              <p className="mt-1 text-sm text-[#0a1a2f]/70">
                We’ll respond within business hours with availability and ETA.
              </p>
              <div ref={alertRef} className="hidden mt-4 p-3 rounded bg-green-50 text-green-800 text-sm" />
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <label className="grid gap-1 text-sm">
                  Full Name<span className="sr-only">required</span>
                  <input
                    required
                    name="name"
                    className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                  />
                  <span className="error text-xs text-red-600 hidden">This field is required.</span>
                </label>
                <label className="grid gap-1 text-sm">
                  Company
                  <input
                    name="company"
                    className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Email
                  <input
                    required
                    name="email"
                    type="email"
                    className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                  />
                  <span className="error text-xs text-red-600 hidden">Enter a valid email.</span>
                </label>
                <label className="grid gap-1 text-sm">
                  Phone/WhatsApp
                  <input
                    required
                    name="phone"
                    inputMode="tel"
                    placeholder="+91 00000 00000"
                    className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                  />
                  <span className="error text-xs text-red-600 hidden">Include country/area code.</span>
                </label>
                <label className="grid gap-1 text-sm">
                  Port/Location
                  <input
                    name="port"
                    placeholder="Chennai, Mumbai, ..."
                    className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Service Category
                  <select
                    name="category"
                    className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                  >
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
                <textarea
                  name="message"
                  rows={4}
                  className="rounded-xl border border-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                />
              </label>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#2d6da3] hover:bg-[#1f4e79] text-white px-5 py-3 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,.10)] focus-visible:outline focus-visible:outline-[#4fc3f7]"
                >
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

        {/* Banner */}
        <section id="catalogues" className="py-14 relative text-white">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#13294b,#1f4e79)]" />
          <div className="relative mx-auto max-w-[1200px] px-4 md:px-6 flex items-center justify-between">
            <p className="text-base md:text-lg">
              Authorized Distributor — Goa Paints • ROHS/REACH • VOC • Lead/Chrome-free
            </p>
            <span className="text-xs opacity-80">Performance: LCP≤2.5s • CLS≤0.1 • INP≤200ms</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-white py-16 bg-gradient-to-b from-[#0E3857] to-[#0B2C48]">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 grid md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div>
            <div className="font-semibold mb-2">About</div>
            <div className="text-white/80 text-sm">Lorem ipsum dolor sit amet.</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Links</div>
            <div className="text-white/80 text-sm">Lorem ipsum dolor sit.</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Catalogues</div>
            <div className="text-white/80 text-sm">Lorem ipsum dolor sit.</div>
          </div>
          <div id="ports">
            <div className="font-semibold mb-2">Ports</div>
            <div className="text-white/80 text-sm">India • UAE • Oman</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Contact</div>
            <div className="text-white/80 text-sm">+91 • info@...</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Social</div>
            <div className="text-white/80 text-sm">LinkedIn • Instagram</div>
          </div>
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
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Roboto helper */
        .roboto {
          font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', Helvetica, Arial,
            'Apple Color Emoji', 'Segoe UI Emoji';
        }

        /* full-width marquee (no borders, edge-to-edge) */
        .vms-ticker {
          overflow: hidden;
          position: relative;
          width: 100%;
        }
        .vms-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          animation: vms-marquee 10s linear infinite;
          will-change: transform;
        }
        .vms-ticker:hover .vms-track {
          animation-play-state: paused;
        }
        @keyframes vms-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </>
  );
}
