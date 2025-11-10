import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de"],
  defaultLocale: "de",
  localePrefix: "never",
});

export type AppLocale = (typeof routing.locales)[number];
