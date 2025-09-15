import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // نحافظ على إعداد turbopack لو حابب تستخدمه محليًا
  turbopack: {
    root: __dirname,
  },

  // نعطل lightningcss عشان نتجنب خطأ الـ build
  experimental: {
    optimizeCss: false,
  },

  // نتجاهل أخطاء TypeScript في مرحلة الـ build
  typescript: {
    ignoreBuildErrors: true,
  },
    // نتجاهل فحص ESLint أثناء الـ build
    eslint: {
      ignoreDuringBuilds: true,
    },
};

export default nextConfig;
