import type { Metadata, Viewport } from "next";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { AppProviders } from "@/providers/app-providers";
import { cn } from "@/lib/utils";
import { ConsentState } from "@/providers/consent-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Loop – spontane Begegnungen in 15 Minuten",
  description:
    "Loop verbindet Studierende an der Uni Wuppertal über QR-Check-ins und kuratierte Slots. Fokus auf Sicherheit, kurze Wartezeiten und klare Intentionen.",
  applicationName: "Loop",
  openGraph: {
    title: "Loop – spontane Begegnungen auf dem Campus",
    description:
      "Check-in per QR, match in unter 2 Minuten: Die PWA für schnelle Campus-Loops.",
    siteName: "Loop",
    type: "website",
  },
  metadataBase: new URL("https://loop-app.local"),
  authors: [{ name: "Loop Pilotteam" }],
};

export const viewport: Viewport = {
  themeColor: "#78BE20",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const cookieStore = await cookies();
  const storedConsent = cookieStore.get("loop-consent")?.value as
    | ConsentState
    | undefined;

  const initialConsent: ConsentState =
    storedConsent === "granted" || storedConsent === "denied"
      ? storedConsent
      : "pending";

  return (
    <html lang="de" className="scroll-smooth bg-loop-sand">
      <body
        className={cn(
          "min-h-screen bg-loop-sand text-loop-slate",
          spaceGrotesk.variable,
          plexMono.variable,
        )}
      >
        <NextIntlClientProvider messages={messages} locale="de">
          <AppProviders initialConsent={initialConsent}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
