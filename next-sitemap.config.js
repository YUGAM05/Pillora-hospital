/** @type {import('next-sitemap').IConfig} */
const { REDIRECTED_PATHS } = require('./src/seoRedirects.js');

// Private / utility routes (noindex) — keep in sync with src/lib/seo.ts.
const PRIVATE = [
  '/login', '/forgot-password', '/reset-password', '/auth/*', '/hospital/*', '/dashboard', '/api/*',
];

// Pages 301-redirected to www.pillora.in must not be listed here.
// ":param" / ":path*" route patterns become "/*" globs for next-sitemap.
const REDIRECTED = REDIRECTED_PATHS.map((p) => p.replace(/\/:[^/]+\*?$/, '/*'));

module.exports = {
  // This is the hospital portal's own domain (was wrongly www.pillora.in).
  siteUrl: 'https://www.pillorahospital.in',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: [
    ...PRIVATE,
    ...REDIRECTED,
    // TODO(step-3): include /blog once it lists clinic-focused articles (noindex until then).
    '/blog', '/blog/*',
  ],
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    // Drop the non-standard "Host:" directive next-sitemap adds by default.
    transformRobotsTxt: async (_config, robotsTxt) =>
      robotsTxt.replace(/\n# Host\nHost: .*\n/, '\n'),
  },
}
