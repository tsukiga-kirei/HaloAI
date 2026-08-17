import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ToastHost } from "@/components/toast-host";
import "./globals.css";
import "@/components/ui/halo-overlay.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HaloAI",
  description:
    "A shared workspace where teams and AI collaborators turn conversation into outcomes.",
  applicationName: "HaloAI",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1222" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" className={inter.variable} suppressHydrationWarning>
      <body>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
