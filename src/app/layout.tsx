import type { Metadata } from "next";
import { Fraunces, Geist, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

const ethiopic = Noto_Sans_Ethiopic({
  variable: "--font-amharic",
  subsets: ["ethiopic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sign the meeting minutes",
  description:
    "Capture a signature for the Team meeting minutes — 10 year Strategic Plan (15/07/2026).",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Sign minutes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${fraunces.variable} ${ethiopic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
