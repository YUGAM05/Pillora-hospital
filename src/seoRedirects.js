/**
 * 301 redirects for patient-oriented pages that were copied into the hospital
 * portal when this repo was forked from www.pillora.in. They duplicate the
 * patient site, so each one is sent to its pillora.in equivalent.
 *
 * NOT redirected (hospital site keeps them): /, /about, /contact, /partners,
 * /blog (B2B articles), Step 3 pages (/features, /faq, /pricing…), /login,
 * /forgot-password, /reset-password, /auth/*, /hospital/*, /dashboard, /api/*,
 * /_next/*, and static files.
 *
 * ⚠️ Review the table in docs/seo/REPORT.md before deploying.
 */
const PATIENT_SITE = 'https://www.pillora.in';

// [source on pillorahospital.in, destination path on pillora.in]
const PATHS = [
  ['/blood-bank', '/blood-bank'],
  ['/hospitals', '/hospitals'],
  ['/hospitals/:slug', '/hospitals/:slug'],
  ['/health-hub', '/health-hub'],
  ['/health-hub/:id', '/health-hub/:id'],
  ['/careers', '/careers'],
  ['/help', '/help'],
  ['/privacy', '/privacy'],
  ['/terms', '/terms'],
  ['/returns', '/returns'],
  ['/register', '/register'],
  ['/cart', '/cart'],
  ['/checkout', '/checkout'],
  ['/checkout/:path*', '/checkout/:path*'],
  ['/my-orders', '/my-orders'],
  ['/my-orders/:path*', '/my-orders/:path*'],
  ['/my-blood-requests', '/my-blood-requests'],
  ['/my-donor-profile', '/my-donor-profile'],
  ['/order/:path*', '/order/:path*'],
  ['/order-success/:path*', '/order-success/:path*'],
  ['/products/:path*', '/products/:path*'],
  ['/lab-tests', '/lab-tests'],
  ['/safety-checker', '/safety-checker'],
  ['/upload-prescription', '/upload-prescription'],
];

const seoRedirects = PATHS.map(([source, dest]) => ({
  source,
  destination: `${PATIENT_SITE}${dest}`,
  statusCode: 301,
}));

module.exports = { seoRedirects, REDIRECTED_PATHS: PATHS.map(([s]) => s) };
