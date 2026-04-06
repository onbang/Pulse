"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IntroAction = {
  href: string;
  label: string;
  variant?: "default" | "outline";
  className?: string;
};

type IntroStat = {
  label: string;
  value: string;
  body: string;
};

export function PageIntro({
  eyebrow,
  title,
  subtitle,
  actions = [],
  stats = [],
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: IntroAction[];
  stats?: IntroStat[];
  className?: string;
}) {
  return (
    <div className={cn("hero-shell", className)}>
      <div className="relative z-10 flex flex-col gap-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="page-heading mt-3">{title}</h1>
            <p className="page-subheading mt-4">{subtitle}</p>
          </div>

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3 xl:max-w-sm xl:justify-end">
              {actions.slice(0, 2).map((action) => (
                <Button
                  key={`${action.href}-${action.label}`}
                  asChild
                  size="lg"
                  variant={action.variant ?? "default"}
                  className={action.className}
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="stat-pill flex h-full min-h-[142px] flex-col justify-between px-5 py-5"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {stat.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
