/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure puppeteer-core and @sparticuz/chromium are treated as external for server components
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Avoid bundling puppeteer-core and chromium to prevent ESM private field parse errors in SWC
      config.externals = config.externals || [];
      config.externals.push("puppeteer-core", "@sparticuz/chromium");
    }
    return config;
  },
};

export default nextConfig;
