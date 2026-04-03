import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";

import { Header } from "@/components/header";
import { NavBar } from "@/components/nav-bar";
import { Toaster } from "@/components/ui/toaster";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

import { Providers } from "./providers";
import "./globals.css";

const navBarLinks = [
  { href: ROUTES.swap, labelKey: "nav.swap" },
  { href: ROUTES.pools, labelKey: "nav.pools" },
  { href: ROUTES.profile, labelKey: "nav.profile" },
];

export const metadata: Metadata = {
  title: "STON Pulse",
  icons: {
    icon: "/pulse-logo.png",
    apple: "/pulse-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();

  return (
    <html lang="en">
      <body className={cn("flex min-h-[100svh] flex-col overflow-x-hidden")}>
        <Providers>
          <Header />
          <NavBar className="mx-auto" links={navBarLinks} />
          <main className="container relative flex h-full flex-1 flex-col py-8 md:py-10">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
