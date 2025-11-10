declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PwaOptions {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    cacheStartUrl?: boolean;
    fallbacks?: Record<string, string>;
    [key: string]: unknown;
  }

  export default function withPWA(options?: PwaOptions): (nextConfig: NextConfig) => NextConfig;
}
