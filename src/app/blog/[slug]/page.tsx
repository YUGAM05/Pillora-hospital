import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SHOW_DRAFTS, getArticle, visibleArticles } from "@/content/blog";
import { noIndexMetadata, pageMetadata } from "@/lib/seo";
import { JsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/structuredData";
import { Breadcrumbs, CtaBand } from "@/components/marketing/Blocks";

type Params = { params: { slug: string } };

// Only published articles (and drafts when SHOW_DRAFTS=true) are generated;
// anything else is a real 404. Unknown slugs from the old copied patient blog
// are 301-redirected to www.pillora.in by src/middleware.ts before reaching here.
export const dynamicParams = false;

export function generateStaticParams() {
    return visibleArticles().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
    const a = getArticle(params.slug);
    if (!a) return noIndexMetadata("Blog");
    if (a.draft) return noIndexMetadata(`Draft: ${a.title}`);
    return pageMetadata({
        title: `${a.title} | Pillora`,
        description: a.description,
        path: `/blog/${a.slug}`,
        type: "article",
        publishedTime: a.datePublished,
        modifiedTime: a.dateModified,
    });
}

export default function BlogArticlePage({ params }: Params) {
    const a = getArticle(params.slug);
    if (!a || (a.draft && !SHOW_DRAFTS)) notFound();

    const path = `/blog/${a.slug}`;
    return (
        <main className="bg-white">
            {!a.draft && (
                <JsonLd
                    data={[
                        articleJsonLd({ headline: a.title, description: a.description, path, datePublished: a.datePublished, dateModified: a.dateModified }),
                        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: a.title, path }]),
                        ...(a.faqs.length ? [faqJsonLd(a.faqs)] : []),
                    ]}
                />
            )}
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: a.title }]} />

            <article className="max-w-3xl mx-auto px-6 pt-8 pb-12">
                {a.draft && (
                    <p className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold" role="note">
                        Draft preview: not published, not indexed. Complete the TODOs (reviewer, sources) and set <code>draft: false</code> to publish.
                    </p>
                )}
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">{a.title}</h1>
                <p className="mt-4 text-sm text-slate-400 font-semibold">
                    {a.readTime}
                    {a.datePublished && (
                        <> · {new Date(a.datePublished).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" })}</>
                    )}
                </p>
                <p className="mt-8 text-xl text-slate-600 leading-relaxed">{a.intro}</p>

                {a.sections.map((s) => (
                    <section key={s.heading} className="mt-10">
                        <h2 className="text-2xl font-black text-slate-900">{s.heading}</h2>
                        {s.paragraphs.map((p) => (
                            <p key={p.slice(0, 40)} className="mt-4 text-slate-700 leading-relaxed text-lg">{p}</p>
                        ))}
                        {s.bullets && (
                            <ul className="mt-4 space-y-2 list-disc pl-6 text-slate-700 text-lg">
                                {s.bullets.map((b) => <li key={b}>{b}</li>)}
                            </ul>
                        )}
                    </section>
                ))}

                {a.faqs.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-2xl font-black text-slate-900">Frequently asked questions</h2>
                        {a.faqs.map((f) => (
                            <div key={f.question} className="mt-6">
                                <h3 className="text-lg font-black text-slate-900">{f.question}</h3>
                                <p className="mt-2 text-slate-700 leading-relaxed">{f.answer}</p>
                            </div>
                        ))}
                    </section>
                )}

                <section className="mt-12 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h2 className="text-lg font-black text-slate-900">Related on Pillora</h2>
                    <ul className="mt-3 space-y-2">
                        {a.related.map((r) => (
                            <li key={r.href}>
                                <Link href={r.href} className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline">
                                    {r.label} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mt-10 text-sm text-slate-500">
                    <h2 className="text-base font-black text-slate-900">Sources</h2>
                    <ul className="mt-2 space-y-1 list-disc pl-5">
                        {a.sources.map((s) => (
                            <li key={s.title}>{s.url ? <a href={s.url} rel="noopener" className="underline hover:text-blue-600">{s.title}</a> : s.title}</li>
                        ))}
                    </ul>
                    <p className="mt-4">Reviewed by: {a.reviewer || "TODO(reviewer): add reviewer name and role before publishing"}</p>
                </section>
            </article>
            <CtaBand />
        </main>
    );
}
