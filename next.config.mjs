import seoRedirectsModule from './src/seoRedirects.js';
const { seoRedirects } = seoRedirectsModule;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 301 patient-page redirects to www.pillora.in (see src/seoRedirects.js)
  async redirects() {
    return seoRedirects;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'content.jdmagicbox.com'
      },
      {
        protocol: 'https',
        hostname: '**',  // ✅ allows any external https image URL
      }
    ],
    formats: ['image/avif', 'image/webp']
  }
};

export default nextConfig;