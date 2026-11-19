/** @type {import('next-sitemap').IConfig} */
const fs = require('fs');
const path = require('path');
const { REDIRECTED_PATHS } = require('./src/seoRedirects.js');

// Private / utility routes (noindex) — keep in sync with src/lib/seo.ts.
const PRIVATE = [
  '/login', '/forgot-password', '/reset-password', '/auth/*', '/hospital/*', '/dashboard', '/api/*',
];

// Pages 301-redirected to www.pillora.in must not be listed here.
// ":param" / ":path*" route patterns become "/*" globs for next-sitemap.
const REDIRECTED = REDIRECTED_PATHS.map((p) => p.replace(/\/:[^/]+\*?$/, '/*'));

/**
 * Keep the sitemap consistent with each page's robots meta: if the built HTML
 * for a route says "noindex" (e.g. the blog index while every article is
 * still a draft), leave it out. Draft articles are never built in production.
 */
const isNoindex = (route) => {
  const file = path.join(__dirname, '.next', 'server', 'app', `${route === '/' ? 'index' : route.replace(/^\//, '')}.html`);
  try {
    return /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(fs.readFileSync(file, 'utf8'));
  } catch {
    return false; // dynamic route without prebuilt HTML: rely on explicit excludes
  }
};

module.exports = {
  // This is the hospital portal's own domain (was wrongly www.pillora.in).
  siteUrl: 'https://www.pillorahospital.in',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: [...PRIVATE, ...REDIRECTED],
  transform: async (config, route) => {
    if (isNoindex(route)) return null;
    return {
      loc: route,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    // Drop the non-standard "Host:" directive next-sitemap adds by default.
    transformRobotsTxt: async (_config, robotsTxt) =>
      robotsTxt.replace(/\n# Host\nHost: .*\n/, '\n'),
  },
}
