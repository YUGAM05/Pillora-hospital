
/**
 * Compact footer for the hospital partner portal.
 * The full marketing footer (About, Careers, Blog, Refund policy…) belongs to
 * the public site, not to a logged-in staff tool, so here we keep only the
 * links hospital staff actually need. They point to the main pillora.in pages.
 */
const MAIN_SITE = 'https://www.pillora.in';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-100 py-6 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} Pillora · Hospital Partner Portal</p>
                <nav aria-label="Portal footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                    <a href={`${MAIN_SITE}/help`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 py-1">Help Center</a>
                    <a href={`${MAIN_SITE}/contact`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 py-1">Contact Support</a>
                    <a href={`${MAIN_SITE}/privacy`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 py-1">Privacy</a>
                    <a href={`${MAIN_SITE}/terms`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 py-1">Terms</a>
                </nav>
            </div>
        </footer>
    );
}
