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
  title: "It's The Season",
  description: "Seasonal UK dropshipping catalogue",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-fuchsia-600 to-amber-400" />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-[0.15em] uppercase text-slate-500">
                    it&#39;s the
                  </span>
                  <span className="text-xl font-semibold tracking-tight text-slate-900">
                    season
                  </span>
                </div>
              </div>
              <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
                <span className="cursor-default text-slate-900">Home</span>
                <span className="cursor-default text-slate-500">About</span>
              </nav>
              <div className="flex items-center gap-3">
                <button className="hidden rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 sm:inline-flex">
                  Sign in
                </button>
                <button className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                  Get started
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
              {children}
            </div>
          </main>
          <footer className="border-t border-slate-200 bg-white/80">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
              <span>© {new Date().getFullYear()} It&#39;s The Season.</span>
              <span>Seasonal dropshipping for the UK.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
