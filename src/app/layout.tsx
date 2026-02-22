import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const appUrl =
  process.env.APP_URL || process.env.BETTER_AUTH_URL || "https://ncts.app";

export const metadata: Metadata = {
  title: {
    default: "ncts.app — The NCT Framework, finally a tool",
    template: "%s | ncts.app",
  },
  description:
    "The first dedicated tool for the NCT framework. Connect strategy to execution — Narratives, Commitments & Tasks in one hierarchy. Free, open source, AI-ready.",
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "ncts.app",
    title: "ncts.app — The NCT Framework, finally a tool",
    description:
      "The first dedicated tool for the NCT framework. Connect strategy to execution — Narratives, Commitments & Tasks in one hierarchy. Free, open source, AI-ready.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ncts.app — The NCT Framework, finally a tool",
    description:
      "The first dedicated tool for the NCT framework. Connect strategy to execution — Narratives, Commitments & Tasks in one hierarchy. Free, open source, AI-ready.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
