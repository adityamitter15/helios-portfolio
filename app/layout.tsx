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

// This project's own deployment. It must never point at builtbyhelios.vercel.app, which is the
// separate client-facing HELIOS site: sharing is done by forwarding links, so a canonical or OG URL
// belonging to another site makes every preview claim to be that site.
// Update this if a custom domain is bought.
// The project's own production alias, verified as serving THIS site. It is not
// helios-portfolio.vercel.app, which reads like the obvious guess and was what this said: that
// subdomain belongs to an unrelated Vercel user (it currently serves a portfolio for someone
// else entirely). Pointing metadataBase there made the canonical tag hand this page to a
// stranger's domain and made every link preview claim to be their site, which is the same class
// of mistake the note below is already about, just aimed at a different wrong host.
// Update this if a custom domain is bought, and check what the host actually serves first.
const SITE_URL = "https://helios-portfolio-lyart.vercel.app";
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
