/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirects removed for hospital panel to prevent build-time fetch errors

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