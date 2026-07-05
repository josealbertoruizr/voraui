import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteHeader } from "@/components/site/site-header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://voraui.vercel.app"),
  title: {
    default: "Vora UI - Crypto analytics components for shadcn/ui",
    template: "%s | Vora UI",
  },
  description:
    "Open source crypto market analytics components. Install with the shadcn CLI, get real data out of the box from free public APIs, keep full control via props.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteHeader />
          {children}
          <footer className="border-t border-border py-6">
            <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
              Vora UI. Open source, MIT licensed. Data from alternative.me, CoinPaprika, and Binance public APIs.
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
