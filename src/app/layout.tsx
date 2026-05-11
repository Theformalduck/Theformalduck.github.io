import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Folio.ai — Your Modern Career Platform",
  description:
    "AI-powered resume builder, portfolio generator, and personal branding platform for internet-native professionals.",
  keywords: ["resume builder", "portfolio", "AI resume", "career platform", "personal branding"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#050508] text-white">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(20,20,30,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: 13,
                backdropFilter: "blur(20px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.40)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
