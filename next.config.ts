import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4000mb", // Разрешаем файлы до 4 ГБ
    },
  },
};

export default nextConfig;