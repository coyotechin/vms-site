"use client";

import React from "react";

/**
 * Vibrant Marine Supplies — About Us Page
 * Tech: Next.js (App Router) + Tailwind CSS
 * File path (recommended): app/about/page.tsx
 *
 * Notes:
 * - Replace placeholder copy with your final content.
 * - Tailwind classes assume Tailwind is already configured in your project.
 * - No external UI libs required. Pure Tailwind for easy drop‑in.
 */

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-white to-white" />
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide text-sky-700">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> ABOUT US
              </p>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                Vibrant Marine Supplies
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                We are an ISO 9001:2015 certified supplier and an approved vendor to the Indian Navy, committed to
                delivering ship stores, technical supplies, and specialized services—on time, every time—across India and
                through partners in Oman & UAE.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#coverage"
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Our Coverage
                </a>
                <a
                  href="#certifications"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Certifications
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                <dl className="grid grid-cols-2 gap-6">
                  <Metric label="Ports Covered" value="70+" note="India (major & minor)" />
                  <Metric label="Response" value="24×7" note="Rapid turnarounds" />
                  <Metric label="Experience" value="10+ yrs" note="Marine supplies" />
                  <Metric label="Fulfillment" value="Ready stocks" note="Prompt delivery" />
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Who We Are ===== */}
      <section className="border-y border-slate-100 bg-slate-50" id="who-we-are">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold sm:text-3xl">Who We Are</h2>
              <p className="mt-3 text-slate-600">
                Vibrant Marine Supplies (VMS) is a one‑stop solution for vessels. We serve ship owners & managers,
                cruise liners, shipyards, and marine catering/contracting companies with quality, speed, and reliability.
              </p>
            </div>
            <div className="lg:col-span-2">
              <div className="grid gap-6 sm:grid-cols-2">
                <Card title="Mission" body="Deliver the right marine products/services at the right time—safely, transparently, and cost‑effectively." />
                <Card title="Vision" body="Become a global leader in the marine industry, known for quality, excellence, and on‑time delivery—every time." />
                <Card
                  title="Core Values"
                  body="Quality, Excellence, Commitment, Dedication, Loyalty, Reliability. We operate with professionalism and teamwork."
                />
                <Card
                  title="What We Do"
                  body="Technical & other stores (IMPA/ISSA), LSA/FFA & SOLAS items, bridge equipment, publications & stationery, lashing, hatch sealing, and more."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Certifications ===== */}
      <section id="certifications" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Certifications & Approvals</h2>
              <p className="mt-3 text-slate-600">
                We comply with global standards and environmental guidelines. Our systems and products are built for long‑term performance and safety.
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
                <li className="flex items-start gap-3">
                  <Badge>ISO 9001:2015</Badge> Quality Management Systems
                </li>
                <li className="flex items-start gap-3">
                  <Badge>Indian Navy</Badge> Approved Vendor
                </li>
                <li className="flex items-start gap-3">
                  <Badge>ROHS/REACH</Badge> Conforming (per OEMs)
                </li>
                <li className="flex items-start gap-3">
                  <Badge>VOC Compliant</Badge> LEED‑aligned where applicable
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold">Authorised Distribution</h3>
              <p className="mt-2 text-sm text-slate-600">
                VMS is an authorised distributor of <strong>Goa Paints</strong> (est. 1978), offering marine & industrial coatings, anti‑fouling, HVAC/refrigeration products, PVC adhesives, PU paints, thermal barrier coatings, and private‑label/custom formulations.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-3">
                <Pill>Lead/Chrome‑free</Pill>
                <Pill>Xylene/Toluene‑free</Pill>
                <Pill>Isocyanate‑free</Pill>
                <Pill>Marine Coatings</Pill>
                <Pill>Wire/Rope Lubes</Pill>
                <Pill>Custom Formulations</Pill>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Coverage ===== */}
      <section id="coverage" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Geographic Coverage</h2>
              <p className="mt-3 text-slate-600">
                We operate 24×7 with ready stocks and logistics support across India’s major & minor ports, and through partners in Oman & UAE.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Tag>Pan‑India Ports</Tag>
                <Tag>Quick Turnaround</Tag>
                <Tag>Cold‑chain Ready</Tag>
                <Tag>Customs Support</Tag>
                <Tag>Last‑mile Delivery</Tag>
                <Tag>On‑board Handover</Tag>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold">Sectors We Serve</h3>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <li className="flex items-center gap-2"><Dot /> Ship Owners & Management</li>
                <li className="flex items-center gap-2"><Dot /> Cruise Liners</li>
                <li className="flex items-center gap-2"><Dot /> Shipyards</li>
                <li className="flex items-center gap-2"><Dot /> Marine Catering & Contracting</li>
              </ul>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                Need port‑specific assistance? <a className="font-semibold text-sky-700 hover:underline" href="#contact">Contact our ops team</a> for a quick schedule.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Leadership ===== */}
      <section id="leadership" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Leadership</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileCard
              name="Mir Ghazanfar Abbas"
              role="Founder & CEO"
              blurb="Driving VMS with a vision for operational excellence, client satisfaction, and global expansion."
            />
            <ProfileCard
              name="Rishwanth"
              role="Co‑Founder & CFO"
              blurb="Finance & operations leadership ensuring sustainable growth and compliance."
            />
            <ProfileCard
              name="Team VMS"
              role="Operations • Supply • Quality"
              blurb="A disciplined, 24×7 operations team focused on speed, safety, and reliability."
            />
          </div>
        </div>
      </section>

      {/* ===== Promise / Principles ===== */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Our Promise</h2>
              <p className="mt-3 text-slate-200">
                We anticipate and customize client needs, delivering personalized, efficient service with integrity and transparency.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-3"><Check /> Quality First</li>
                <li className="flex items-start gap-3"><Check /> Professionalism & Teamwork</li>
                <li className="flex items-start gap-3"><Check /> Safety & Compliance</li>
                <li className="flex items-start gap-3"><Check /> On‑time, Every Time</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-white/5 p-6">
              <h3 className="text-base font-semibold">Client Outcomes</h3>
              <dl className="mt-4 grid grid-cols-2 gap-6 text-sm">
                <MetricDark label="Turnaround Time" value="Fast" note="Ports & on‑board" />
                <MetricDark label="Fulfillment Rate" value=">98%" note="Ready stocks" />
                <MetricDark label="Satisfaction" value=">95%" note="Repeat clients" />
                <MetricDark label="Safety" value="100%" note="Compliant" />
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="contact" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid items-center gap-8 rounded-3xl border border-slate-200 p-8 shadow-sm sm:p-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold sm:text-3xl">Need a quick quote or port schedule?</h2>
              <p className="mt-2 text-slate-600">Call/WhatsApp <strong>+91 7401 7401 39</strong> • Email <strong>info@vibrantmarinesupplies.com</strong></p>
            </div>
            <div className="flex justify-end">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                Get Quote
              </a>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">Powered by COYOTECH</p>
        </div>
      </section>
    </main>
  );
}

/* ======================= Small, Reusable Bits ======================= */
function ProfileCard({
  name,
  role,
  blurb,
  avatar,
}: {
  name: string;
  role: string;
  blurb: string;
  avatar?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 flex-none overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">
              {name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{name}</h3>
          <p className="text-xs font-medium text-sky-700">{role}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{blurb}</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold">{value}</dd>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </div>
  );
}

function MetricDark({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/0 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-300">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold text-white">{value}</dd>
      {note ? <p className="mt-1 text-xs text-slate-400">{note}</p> : null}
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200">
      {children}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-0.5 inline-flex min-w-[2rem] items-center justify-center rounded-md bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700 ring-1 ring-sky-100">
      {children}
    </span>
  );
}

function Dot() {
  return <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />;
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-1 h-5 w-5 flex-none"
    >
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}