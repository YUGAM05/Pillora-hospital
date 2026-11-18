import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { publishedArticles, visibleArticles } from "@/content/blog";
import { noIndexMetadata, pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { Breadcrumbs, CtaBand, PageHero } from "@/components/marketing/Blocks";
import { PATIENT_SITE } from "@/content/marketing";

const TITLE = "Blog for Clinics and Hospitals | Pillora";
const DESCRIPTION =
    "Practical guides for clinics and hospitals in India on OPD appointments, reducing no-shows, doctor scheduling and moving from paper registers.";

// The index is only indexable once at least one article is published.
export function generateMetadata(): Metadata {
    return publishedArticles().length > 0
        ? pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/blog" })
        : noIndexMetadata("Blog");
}

export default function BlogIndexPage() {
    const articles = visibleArticles();
    return (
        <main className="bg-white">
            <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog" }]} />
            <PageHero
                eyebrow="Blog"
                title="Guides for clinics and hospitals"
                subtitle="Practical, plain-language guides on running OPD appointments, doctor schedules and patient bookings."
            />

            <div className="max-w-5xl mx-auto px-6 pb-12">
                {articles.length === 0 ? (
                    <div className="text-center bg-slate-50 border border-slate-100 rounded-[2rem] p-12">
                        <p className="text-xl font-black text-slate-900">New articles are on the way.</p>
                        <p className="text-slate-500 mt-2">
                            Meanwhile, see <Link href="/features" className="text-blue-600 font-semibold hover:underline">what the hospital dashboard can do</Link> or read{" "}
                            <a href={`${PATIENT_SITE}/blog`} className="text-blue-600 font-semibold hover:underline">patient guides on the Pillora.in blog</a>.
                        </p>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {articles.map((a) => (
                            <li key={a.slug}>
                                <Link href={`/blog/${a.slug}`} className="block h-full p-8 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-200 hover:shadow-lg transition-all">
                                    {a.draft && (
                                        <span className="inline-block mb-3 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider">
                                            Draft, not public
                                        </span>
                                    )}
                                    <h2 className="text-xl font-black text-slate-900">{a.title}</h2>
                                    <p className="text-slate-500 mt-2 leading-relaxed">{a.description}</p>
                                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600">
                                        Read: {a.title} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <CtaBand />
        </main>
    );
}
