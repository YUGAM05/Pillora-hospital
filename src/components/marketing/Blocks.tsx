import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { Capability, Faq } from "@/content/marketing";

/**
 * Server-rendered building blocks for the hospital marketing pages.
 * Visual language follows the existing homepage (slate/blue, rounded cards).
 */

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
    return (
        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-6 pt-8 text-xs font-semibold text-slate-400">
            <ol className="flex flex-wrap items-center gap-1.5">
                {items.map((it, i) => (
                    <li key={it.name} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
                        {it.href ? (
                            <Link href={it.href} className="hover:text-blue-600">{it.name}</Link>
                        ) : (
                            <span className="text-slate-600" aria-current="page">{it.name}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export function PageHero({ eyebrow, title, subtitle, children }: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    return (
        <header className="max-w-6xl mx-auto px-6 pt-10 pb-14 text-center">
            {eyebrow && (
                <p className="inline-flex px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-100">
                    {eyebrow}
                </p>
            )}
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-4xl mx-auto">
                {title}
            </h1>
            {subtitle && (
                <p className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto mt-6 leading-relaxed">{subtitle}</p>
            )}
            {children && <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">{children}</div>}
        </header>
    );
}

export function Section({ id, title, intro, children, muted = false }: {
    id?: string;
    title: string;
    intro?: string;
    children: React.ReactNode;
    muted?: boolean;
}) {
    return (
        <section id={id} className={muted ? "bg-slate-50/70 border-y border-slate-100" : ""}>
            <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{title}</h2>
                {intro && <p className="text-slate-500 font-medium text-lg mt-3 max-w-3xl leading-relaxed">{intro}</p>}
                <div className="mt-10">{children}</div>
            </div>
        </section>
    );
}

export function CapabilityCard({ cap, headingLevel = 3 }: { cap: Capability; headingLevel?: 2 | 3 }) {
    const H = headingLevel === 2 ? "h2" : "h3";
    return (
        <article id={cap.id} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm scroll-mt-28">
            <H className="text-xl md:text-2xl font-black text-slate-900 mb-3">{cap.title}</H>
            <p className="text-slate-600 font-medium leading-relaxed">{cap.summary}</p>
            <ul className="mt-5 space-y-2.5">
                {cap.details.map((d) => (
                    <li key={d} className="flex gap-3 text-slate-500 text-sm leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                        <span>{d}</span>
                    </li>
                ))}
            </ul>
        </article>
    );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-base shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 min-h-[44px]">
            {children} <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Link>
    );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-[2rem] font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center min-h-[44px]">
            {children}
        </Link>
    );
}

/** Closing call-to-action used at the bottom of marketing pages. */
export function CtaBand({ title = "See Pillora with your own schedule", text }: { title?: string; text?: string }) {
    return (
        <section className="max-w-6xl mx-auto px-6 py-16">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 text-white text-center">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h2>
                <p className="text-slate-300 font-medium text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
                    {text || "Tell us about your hospital or clinic and we will show you how online and walk-in appointments, doctor slots and advance payments work for your team."}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/get-a-quote#request" className="w-full sm:w-auto px-8 py-4 bg-blue-600 rounded-[2rem] font-black hover:bg-blue-500 transition-all min-h-[44px] flex items-center justify-center">
                        Request a demo
                    </Link>
                    <Link href="/faq" className="w-full sm:w-auto px-8 py-4 bg-white/10 border border-white/20 rounded-[2rem] font-bold hover:bg-white/20 transition-all min-h-[44px] flex items-center justify-center">
                        Read the FAQ
                    </Link>
                </div>
            </div>
        </section>
    );
}

/** FAQ list using native <details>, so answers are in the HTML and work without JavaScript. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
    return (
        <div className="space-y-3">
            {faqs.map((f) => (
                <details key={f.question} className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm open:shadow-md">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-black text-slate-900 text-lg">
                        <h3 className="text-lg font-black">{f.question}</h3>
                        <ChevronRight className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-90 shrink-0" aria-hidden="true" />
                    </summary>
                    <p className="mt-4 text-slate-600 leading-relaxed">{f.answer}</p>
                </details>
            ))}
        </div>
    );
}
