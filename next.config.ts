// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This option allows you to opt-out of bundling certain packages on the server.
    // Instead, they will be resolved at runtime from node_modules.
    serverComponentsExternalPackages: ['lighthouse', 'chrome-launcher'],
  },
};

export default nextConfig;