"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import Image from "next/image";

import { TelegramBadge } from "@/components/telegram/telegram-badge";
import { Badge } from "@/components/ui/badge";
import GitBookIcon from "@/public/icons/gitbook.svg";
import GitHubIcon from "@/public/icons/github.svg";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,248,255,0.84))] backdrop-blur-2xl">
      <section className="container flex min-h-24 items-center gap-4 py-4">
        <a
          href="https://ston.fi/"
          target="_blank noopener noreferrer"
          className="mesh-card relative mr-auto flex items-center gap-4 rounded-full px-3 py-3 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Image
            src="/pulse-logo.png"
            width={220}
            height={72}
            alt="Pulse logo"
            className="h-11 w-auto rounded-full object-contain"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Community Layer
            </p>
            <p className="text-sm font-semibold text-slate-900">STON Pulse</p>
          </div>
          <Badge className="absolute -bottom-1 -right-6 rotate-[-13deg] scale-[0.8] border border-white/10 bg-[linear-gradient(135deg,#0180FF,#7354F2)] text-white shadow-lg">
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
