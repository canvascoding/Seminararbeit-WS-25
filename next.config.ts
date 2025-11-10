import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {},
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(
  withPWA({
    dest: "public",
    disable: !isProd,
    register: true,
    skipWaiting: true,
    fallbacks: {
      document: "/offline.html",
    },
  })(nextConfig),
);
