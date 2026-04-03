"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import Image from "next/image";

import { TelegramBadge } from "@/components/telegram/telegram-badge";
import { Badge } from "@/components/ui/badge";
import GitBookIcon from "@/public/icons/gitbook.svg";
import GitHubIcon from "@/public/icons/github.svg";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/55 backdrop-blur-2xl">
      <section className="container flex min-h-20 items-center gap-4 py-3">
        <a
          href="https://ston.fi/"
          target="_blank noopener noreferrer"
          className="relative mr-auto flex items-center gap-4 rounded-full border border-white/70 bg-white/70 px-4 py-2 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.45)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Image
            src="https://static.ston.fi/branbook/ston/logo/black.svg"
            width={120}
            height={40}
            alt="logo"
          />
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Community Layer
            </p>
            <p className="text-sm font-semibold text-slate-900">STON Pulse</p>
          </div>
          <Badge className="absolute -bottom-1 -right-6 rotate-[-13deg] scale-[0.8] border-0 bg-[linear-gradient(135deg,#0f172a,#0284c7)] text-white shadow-lg">
            pulse
          </Badge>
        </a>

        <TonConnectButton />
        <TelegramBadge />
        <a
          href="https://github.com/ston-fi/sdk"
          target="_blank noopener noreferrer"
          className="rounded-full border border-white/70 bg-white/80 p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-80"
        >
          <Image src={GitHubIcon} alt="GitHub" width={24} height={24} />
        </a>
        <a
          href="https://docs.ston.fi/docs/developer-section/sdk"
          target="_blank noopener noreferrer"
          className="rounded-full border border-white/70 bg-white/80 p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-80"
        >
          <Image src={GitBookIcon} alt="GitBook" width={24} height={24} />
        </a>
      </section>
    </header>
  );
}
