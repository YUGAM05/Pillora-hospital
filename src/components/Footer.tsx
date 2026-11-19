import Link from 'next/link';
import { NAV_LINKS, PATIENT_SITE, REGISTERED_ADDRESS, SUPPORT_PHONE } from '@/content/marketing';

/**
 * Footer for the hospital partner portal: product/company links, support and
 * legal links (legal pages live on www.pillora.in), and contact details.
 *
 * Company name: "Pillora" everywhere on this site. The About page does not name
 * a legal entity, so "Pillora Inc." (used on www.pillora.in) is not shown here.
 * TODO(company-name) [CONFIRM]: the registered legal name, then use it on both sites.
 */
export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-100 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
                <div>
                    <p className="font-black text-slate-900">Pillora for Hospitals</p>
                    <p className="text-slate-500 mt-2 leading-relaxed">
                        Pillora is a healthcare technology platform that helps hospitals, clinics and doctors manage appointments digitally.
                    </p>
                </div>
                <nav aria-label="Company">
                    <p className="font-black text-slate-900 mb-3">Company</p>
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
                <div>
                    <p className="font-black text-slate-900 mb-3">Contact Us</p>
                    <ul className="space-y-2 text-slate-500">
                        <li><a href={`tel:${SUPPORT_PHONE.tel}`} className="hover:text-blue-600 py-1 inline-block font-semibold">Call {SUPPORT_PHONE.display}</a></li>
                        <li><a href={PATIENT_SITE} className="hover:text-blue-600 py-1 inline-block font-semibold">www.pillora.in</a></li>
                        <li>
                            <address className="not-italic leading-relaxed">{REGISTERED_ADDRESS}</address>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-100">
                <p className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} Pillora · Hospital Partner Portal
                </p>
            </div>
        </footer>
    );
}
