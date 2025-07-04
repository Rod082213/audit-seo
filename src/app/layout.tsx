// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SEO Audit Tool",
  description: "Analyze your website for SEO issues and performance metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          // This is the key change: Make the body a flex container
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          inter.className
        )}
      >
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-self-center">
            <div className="mr-4 flex">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
                  <path d="m12 18-3.3-3.3" />
                  <path d="m12 12-3.3-3.3" />
                  <path d="m12 6-3.3 3.3" />
                  <path d="M15.3 12h-6" />
                </svg>
                <span className="font-bold sm:inline-block">
                  SEO Audit Tool
                </span>
              </Link>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-2">
              <nav className="flex items-center">
                <Button variant="ghost" asChild>
                  <Link href="/history">Audit History</Link>
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* This main tag will now grow to fill the space and can center its children */}
        <main className="flex-1 flex flex-col custom-container">{children}</main>
        
        <footer className="py-6 md:px-8 md:py-0">
          <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row justify-self-center">
            <p className="text-center text-sm leading-loose text-muted-foreground">
              Built with Next.js, Prisma, and Shadcn UI.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}