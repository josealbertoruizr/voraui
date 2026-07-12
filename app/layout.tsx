import type { Metadata } from "next";
import Link from "next/link";
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
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border py-4">
            <p className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
              Built by{" "}
              <Link
                href="https://github.com/josealbertoruizr"
                className="underline underline-offset-4 hover:text-foreground"
              >
                josealbertoruizr
              </Link>
              . The source code is available on{" "}
              <Link
                href="https://github.com/josealbertoruizr/voraui"
                className="underline underline-offset-4 hover:text-foreground"
              >
                GitHub
              </Link>
              .
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
