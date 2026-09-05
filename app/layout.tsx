import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

// Instrument Serif, italic only, section 3 of the spec: the one warm human note against the
// metal, used sparingly for "in its best light" and pull quotes. Self-hosted through next/font,
// no <link> to Google.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

// The one HELIOS site. There used to be two: this portfolio, and a separate client-facing
// "Helios Studio" project that owned builtbyhelios.vercel.app. They have been merged, and this
// repo is what that name now serves.
//
// The note that stood here said to never point at builtbyhelios.vercel.app, because at the time
// it belonged to that other project and a canonical tag aimed there would have handed this page
// to a site we did not control. That is no longer true: the alias was moved onto this project on
// 2026-09-05, and the old target is recorded in the commit that did it.
//
// Do not point this at helios-portfolio.vercel.app, which is the obvious guess and is what this
// said before. That subdomain belongs to an unrelated Vercel account and serves a stranger's
// portfolio. helios-portfolio-lyart.vercel.app remains this project's auto-generated URL and
// still works; builtbyhelios.vercel.app is the public one.
//
// Update this if a custom domain is bought, and check what the host actually serves first: both
// mistakes above came from guessing at a name instead of fetching it.
const SITE_URL = "https://builtbyhelios.vercel.app";
const SITE_TITLE = "HELIOS, a web studio run by Aditya Mitter";
const SITE_DESCRIPTION =
  "Your business, in its best light. HELIOS is the one-person web studio run by Aditya Mitter in London. See your homepage before you pay: a free mockup, no deposit.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | HELIOS",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  applicationName: "HELIOS",
  authors: [{ name: "Aditya Mitter" }],
  creator: "Aditya Mitter",
  keywords: [
    "web design London",
    "website design",
    "small business website",
    "web studio",
    "Aditya Mitter",
    "HELIOS",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    siteName: "HELIOS",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// themeColor and colorScheme live on the viewport export, not metadata, since Next.js 14.
export const viewport: Viewport = {
  themeColor: "#08090C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable} h-full`}
    >
      {/* No bg-* on body: html already paints the ground, and an opaque body background sits on top
          of the fixed aurora layer and hides it completely. */}
      <body className="flex min-h-full flex-col font-sans text-text antialiased">
        {children}
      </body>
    </html>
  );
}
