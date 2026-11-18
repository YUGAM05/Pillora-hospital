import Link from 'next/link';
import { NAV_LINKS, PATIENT_SITE } from '@/content/marketing';

/**
 * Footer for the hospital partner portal: product links for the B2B pages,
 * a cross-link to the patient booking site, and the support/legal links
 * (which live on the main www.pillora.in site).
 */
export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-100 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                <div>
                    <p className="font-black text-slate-900">Pillora for Hospitals</p>
                    <p className="text-slate-500 mt-2 leading-relaxed">
                        Appointment and doctor schedule software for hospitals and clinics in India.
                    </p>
                    <a href={PATIENT_SITE} className="inline-block mt-3 font-semibold text-blue-600 hover:underline">
                        Patients: find doctors and book on Pillora.in
                    </a>
                </div>
                <nav aria-label="Product">
                    <p className="font-black text-slate-900 mb-3">Product</p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-500">
                        {NAV_LINKS.map((l) => (
                            <li key={l.href}><Link href={l.href} className="hover:text-blue-600 py-1 inline-block">{l.label}</Link></li>
                        ))}
                        <li><Link href="/about" className="hover:text-blue-600 py-1 inline-block">About</Link></li>
                        <li><Link href="/contact" className="hover:text-blue-600 py-1 inline-block">Contact</Link></li>
                    </ul>
                </nav>
                <nav aria-label="Support and legal">
                    <p className="font-black text-slate-900 mb-3">Support</p>
                    <ul className="space-y-2 text-slate-500">
                        <li><Link href="/login" className="hover:text-blue-600 py-1 inline-block">Hospital login</Link></li>
                        <li><a href={`${PATIENT_SITE}/help`} className="hover:text-blue-600 py-1 inline-block">Help Center</a></li>
                        <li><a href={`${PATIENT_SITE}/privacy`} className="hover:text-blue-600 py-1 inline-block">Privacy policy</a></li>
                        <li><a href={`${PATIENT_SITE}/terms`} className="hover:text-blue-600 py-1 inline-block">Terms</a></li>
                    </ul>
                </nav>
            </div>
            <div className="border-t border-slate-100">
                <p className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} Pillora · Hospital Partner Portal · +91 94291 67856
                </p>
            </div>
        </footer>
    );
}
