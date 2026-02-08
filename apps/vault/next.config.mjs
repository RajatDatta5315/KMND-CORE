/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: 'https://kmnd-core.rajat90000.workers.dev/:path*', // Tera asli worker URL yahan aayega
      },
    ];
  },
};

export default nextConfig;
