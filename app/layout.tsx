import type { Metadata, Viewport } from "next";
import {
  Geist, Geist_Mono, Space_Grotesk, Playfair_Display, DM_Serif_Display,
  Cormorant_Garamond, Roboto_Slab, Quicksand, Nunito, Syne,
} from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

// Theme fonts — exposed as CSS variables and wired to font utilities in globals.css.
const spaceGrotesk = Space_Grotesk({ variable: "--ff-grotesk", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--ff-serif", subsets: ["latin"], display: "swap" });
const dmSerif = DM_Serif_Display({ variable: "--ff-editorial", subsets: ["latin"], weight: ["400"], display: "swap" });
const cormorant = Cormorant_Garamond({ variable: "--ff-elegant", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const robotoSlab = Roboto_Slab({ variable: "--ff-slab", subsets: ["latin"], display: "swap" });
const quicksand = Quicksand({ variable: "--ff-rounded", subsets: ["latin"], display: "swap" });
const nunito = Nunito({ variable: "--ff-playful", subsets: ["latin"], display: "swap" });
const syne = Syne({ variable: "--ff-display", subsets: ["latin"], display: "swap" });

const fontVars = [
  geistSans.variable, geistMono.variable, spaceGrotesk.variable, playfair.variable,
  dmSerif.variable, cormorant.variable, robotoSlab.variable, quicksand.variable,
  nunito.variable, syne.variable,
].join(" ");

const siteUrl = process.env.NEXTAUTH_URL ?? "https://sellora.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sellora — The Creator Operating System",
    template: "%s | Sellora",
  },
  description:
    "Build portfolios, launch crowdfunding campaigns, sell products, and grow your audience — all in one platform built for creators.",
  applicationName: "Sellora",
  keywords: [
    "creator platform",
    "portfolio builder",
    "crowdfunding",
    "ecommerce",
    "creator economy",
    "digital products",
    "freelance",
  ],
  openGraph: {
    title: "Sellora — The Creator Operating System",
    description:
      "Build portfolios, launch campaigns, sell products, and grow your creator business.",
    url: siteUrl,
    siteName: "Sellora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sellora — The Creator Operating System",
    description:
      "Build portfolios, launch campaigns, sell products, and grow your creator business.",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b9ded",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontVars} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
