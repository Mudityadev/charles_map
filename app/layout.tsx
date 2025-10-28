import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Charles Map - Mapping Platform",
  description: "Create, edit, and export maps with annotations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/30 via-sky-400/20 to-transparent blur-3xl" />
            <div className="absolute -bottom-40 left-0 h-[24rem] w-[24rem] -translate-x-1/3 rounded-full bg-gradient-to-br from-fuchsia-500/20 via-purple-500/10 to-transparent blur-3xl" />
            <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] translate-x-1/3 translate-y-1/4 rounded-full bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-transparent blur-3xl" />
          </div>
          <main className="relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
