import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // نحافظ على إعداد turbopack لو حابب تستخدمه محليًا
  turbopack: {
    root: __dirname,
  },

  // هنا نضيف تعطيل optimizeCss حتى لا يستخدم lightningcss
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;

