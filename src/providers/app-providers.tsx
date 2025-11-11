"use client";

import { PropsWithChildren, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { AuthProvider } from "./auth-provider";
import {
  ConsentProvider,
  ConsentState,
} from "./consent-provider";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { CookieSettingsTrigger } from "@/components/layout/cookie-settings-trigger";
import { GoogleTag } from "@/components/layout/google-tag";

type AppProvidersProps = PropsWithChildren<{
  initialConsent: ConsentState;
}>;

export function AppProviders({
  children,
  initialConsent,
}: AppProvidersProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ConsentProvider initialConsent={initialConsent}>
          {children}
          <CookieConsentBanner />
          <CookieSettingsTrigger />
          <GoogleTag />
        </ConsentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
