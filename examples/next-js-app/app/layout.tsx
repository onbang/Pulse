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
  { href: ROUTES.swap, label: "Swap" },
  { href: ROUTES.liquidityProvide, label: "Liquidity provide" },
  { href: ROUTES.liquidityRefund, label: "Liquidity refund" },
  { href: ROUTES.vault, label: "Vault" },
  { href: ROUTES.stake, label: "Stake" },
  { href: ROUTES.profile, label: "Profile" },
  { href: ROUTES.checkIn, label: "Check-in" },
  { href: ROUTES.leaderboard, label: "Leaderboard" },
  { href: ROUTES.community, label: "Community" },
];

export const metadata: Metadata = {
  title: "STON Pulse",
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
