import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SasyaSakhi — Your Soil. Our Support. Better Farming.",
    template: "%s · SasyaSakhi",
  },
  description:
    "SasyaSakhi turns soil reports into understandable farming guidance: soil health analysis, crop suitability, fertilizer planning and an AI assistant in English and Telugu. Prototype.",
  keywords: ["soil health", "agriculture", "farming", "crop recommendation", "fertilizer", "Telugu", "India"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
