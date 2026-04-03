"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import Image from "next/image";

import { TelegramBadge } from "@/components/telegram/telegram-badge";
import { Badge } from "@/components/ui/badge";
import GitBookIcon from "@/public/icons/gitbook.svg";
import GitHubIcon from "@/public/icons/github.svg";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[linear-gradient(180deg,rgba(2,6,23,0.84),rgba(15,23,42,0.58))] backdrop-blur-2xl">
      <section className="container flex min-h-24 items-center gap-4 py-4">
        <a
          href="https://ston.fi/"
          target="_blank noopener noreferrer"
          className="mesh-card relative mr-auto flex items-center gap-4 rounded-full px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Image
            src="https://static.ston.fi/branbook/ston/logo/black.svg"
            width={120}
            height={40}
            alt="logo"
            className="rounded-full bg-white px-3 py-2"
          />
          <div className="hidden sm:block">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Community Layer
            </p>
            <p className="text-sm font-semibold text-white">
              STON Pulse
            </p>
          </div>
          <Badge className="absolute -bottom-1 -right-6 rotate-[-13deg] scale-[0.8] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white shadow-lg">
            pulse
          </Badge>
        </a>

        <div className="glass-strip flex items-center gap-2 px-2 py-2">
          <TonConnectButton />
          <TelegramBadge />
        </div>
        <a
          href="https://github.com/ston-fi/sdk"
          target="_blank noopener noreferrer"
          className="glass-strip p-2 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-80"
        >
          <Image src={GitHubIcon} alt="GitHub" width={24} height={24} />
        </a>
        <a
          href="https://docs.ston.fi/docs/developer-section/sdk"
          target="_blank noopener noreferrer"
          className="glass-strip p-2 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-80"
        >
          <Image src={GitBookIcon} alt="GitBook" width={24} height={24} />
        </a>
      </section>
    </header>
  );
}
