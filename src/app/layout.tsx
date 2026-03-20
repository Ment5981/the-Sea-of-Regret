import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

/** Next.js 14.2 的 next/font/google 不含 Geist，改用 Inter + JetBrains Mono */
const fontSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "命中注定的离别",
    template: "%s · 命中注定的离别",
  },
  description:
    "A2A 情感推演：觉醒、广场匹配、三合三离宿命推演、小说与九宫格漫画。SecondMe Hackathon。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-950 text-slate-100">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-600">
          SecondMe · A2A 宿命推演 · 本地演示请勿用于生产密钥
        </footer>
      </body>
    </html>
  );
}
