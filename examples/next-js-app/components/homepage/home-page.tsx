"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import type { AppLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Cta = {
  label: string;
  href: string;
};

type AudienceItem = {
  id: string;
  label: string;
  value: string;
  body: string;
  cta: Cta;
};

type InfoItem = {
  title: string;
  body: string;
};

type FooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

function SmartLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-8 md:py-12", className)}>{children}</section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function HeroSection({
  title,
  subtitle,
  trustPoints,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  subtitle: string;
  trustPoints: string[];
  primaryCta: Cta;
  secondaryCta: Cta;
}) {
  return (
    <Section className="pt-2 md:pt-4">
      <div className="hero-shell px-6 py-8 md:px-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="relative z-10">
            <p className="eyebrow">STON.fi</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <SmartLink href={primaryCta.href}>{primaryCta.label}</SmartLink>
              </Button>
              <Button asChild variant="outline" size="lg">
                <SmartLink href={secondaryCta.href}>
                  {secondaryCta.label}
                </SmartLink>
              </Button>
            </div>
          </div>

          <div className="relative z-10 grid gap-3">
            {trustPoints.map((point) => (
              <div key={point} className="mesh-card px-5 py-5">
                <p className="text-sm font-medium leading-6 text-slate-700">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function AudienceSwitcher({
  items,
  eyebrow,
  title,
  subtitle,
}: {
  items: AudienceItem[];
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const activeItem = useMemo(() => {
    const fallbackItem = items[0];
    return items.find((item) => item.id === activeId) ?? fallbackItem;
  }, [activeId, items]);

  if (!activeItem) {
    return null;
  }

  return (
    <Section>
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <div className="mt-8 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="grid gap-3">
          {items.map((item) => {
            const active = item.id === activeId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  "rounded-[26px] border px-5 py-5 text-left transition-all duration-200",
                  active
                    ? "border-sky-300 bg-[linear-gradient(180deg,rgba(239,247,255,0.98),rgba(232,243,255,0.94))] shadow-[0_20px_50px_-32px_rgba(1,128,255,0.22)]"
                    : "border-white/85 bg-white/90 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50/80",
                )}
              >
                <p className="text-sm font-semibold text-slate-950">
                  {item.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {item.value}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mesh-card p-6 md:p-8">
          <p className="eyebrow">{activeItem.label}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            {activeItem.value}
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            {activeItem.body}
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <SmartLink href={activeItem.cta.href}>
                {activeItem.cta.label}
              </SmartLink>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function TrustStrip({ items }: { items: string[] }) {
  return (
    <Section className="py-4 md:py-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item}
            className="glass-strip px-5 py-4 text-sm font-medium text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks({ items, title }: { items: InfoItem[]; title: string }) {
  return (
    <Section>
      <SectionHeading title={title} />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <div key={item.title} className="mesh-card p-6">
            <p className="text-sm font-semibold text-sky-600">
              Шаг {index + 1}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">
              {item.title}
            </h3>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function BenefitsGrid({ items, title }: { items: InfoItem[]; title: string }) {
  return (
    <Section>
      <SectionHeading title={title} />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="mesh-card p-6">
            <h3 className="text-xl font-semibold text-slate-950">
              {item.title}
            </h3>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function OmnistonSection({
  title,
  subtitle,
  points,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  subtitle: string;
  points: string[];
  primaryCta: Cta;
  secondaryCta: Cta;
}) {
  return (
    <Section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="surface-panel-dark p-7 md:p-9">
          <p className="eyebrow !text-sky-300">Omniston</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            {subtitle}
          </p>
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="text-sm leading-6 text-slate-300">
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary" size="lg">
              <SmartLink href={primaryCta.href}>{primaryCta.label}</SmartLink>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-700/70 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <SmartLink href={secondaryCta.href}>
                {secondaryCta.label}
              </SmartLink>
            </Button>
          </div>
        </div>

        <div className="mesh-card p-6">
          <div className="rounded-[26px] bg-slate-950 p-5 text-sm text-slate-200 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
              SDK flow
            </p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-slate-200">
              {`const quote = await omniston.getQuote({
  from: "TON",
  to: "USDT",
  amount: "1"
})

const route = await omniston.buildRoute(quote)`}
            </pre>
          </div>
        </div>
      </div>
    </Section>
  );
}

function EcosystemProof({
  items,
  title,
  subtitle,
}: {
  items: InfoItem[];
  title: string;
  subtitle: string;
}) {
  return (
    <Section>
      <SectionHeading title={title} subtitle={subtitle} />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="mesh-card p-6">
            <p className="text-sm font-semibold text-sky-600">{item.title}</p>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function UseCaseLinks({ items, title }: { items: InfoItem[]; title: string }) {
  return (
    <Section>
      <SectionHeading title={title} />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="mesh-card p-6">
            <h3 className="text-xl font-semibold text-slate-950">
              {item.title}
            </h3>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FAQSection({
  items,
  title,
}: {
  items: Array<{ question: string; answer: string }>;
  title: string;
}) {
  return (
    <Section>
      <SectionHeading title={title} />
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <details key={item.question} className="mesh-card group p-5">
            <summary className="cursor-pointer list-none text-lg font-semibold text-slate-950 marker:hidden">
              {item.question}
            </summary>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function FinalCTA({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta: Cta;
}) {
  return (
    <Section>
      <div className="surface-panel-dark p-8 md:p-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">{subtitle}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <SmartLink href={primaryCta.href}>{primaryCta.label}</SmartLink>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-slate-700/70 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <SmartLink href={secondaryCta.href}>{secondaryCta.label}</SmartLink>
          </Button>
        </div>
      </div>
    </Section>
  );
}

function Footer({
  columns,
  tagline,
}: {
  columns: FooterColumn[];
  tagline: string;
}) {
  return (
    <footer className="border-t border-white/70 py-10">
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold text-slate-950">
              {column.title}
            </p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <SmartLink
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-950"
                  >
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-sm font-semibold text-slate-950">STON.fi</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function getHomeCopy(language: AppLanguage) {
  if (language === "ru") {
    return {
      hero: {
        title: "DEX на TON, где понятно, быстро и без хранения ваших средств",
        subtitle:
          "Обменивайте токены, добавляйте ликвидность и подключайте DeFi-инфраструктуру через STON.fi. Кошелек и смарт-контракты остаются на вашей стороне.",
        trust: [
          "Non-custodial: STON.fi не хранит ваши средства",
          "Все действия подтверждаются TON-кошельком",
          "Исполнение проходит через смарт-контракты TON",
        ],
        primary: { label: "Начать обмен", href: ROUTES.swap },
        secondary: {
          label: "Изучить Omniston",
          href: "https://docs.ston.fi/developer-section/omniston/sdk",
        },
      },
      audience: {
        eyebrow: "Сценарии",
        title: "Выберите свой сценарий",
        subtitle:
          "Главная не должна объяснять всё сразу. Выберите задачу и идите по прямому маршруту.",
        items: [
          {
            id: "swapper",
            label: "Swapper",
            value: "Обмен токенов без лишних шагов",
            body: "Открывай swap, выбирай активы, смотри котировку и подтверждай сделку в кошельке.",
            cta: { label: "Перейти к обмену", href: ROUTES.swap },
          },
          {
            id: "lp",
            label: "Liquidity provider",
            value: "Ликвидность с понятной точкой входа",
            body: "Смотри пулы, оценивай глубину и переходи к добавлению ликвидности только там, где это действительно интересно.",
            cta: { label: "Открыть пулы", href: ROUTES.pools },
          },
          {
            id: "issuer",
            label: "Token issuer",
            value: "Запуск и рост ликвидности для токена",
            body: "Подключай токен к экосистеме TON, формируй ликвидность и создавай понятный маршрут для трейдеров и LP.",
            cta: { label: "Связаться по листингу", href: "https://ston.fi/" },
          },
          {
            id: "developer",
            label: "Developer / Omniston",
            value: "Интеграция ликвидности в свой продукт",
            body: "Используй Omniston, чтобы подключить маршрутизацию и ликвидность STON.fi в приложение, кошелек или DeFi-сервис.",
            cta: {
              label: "Документация Omniston",
              href: "https://docs.ston.fi/developer-section/omniston/sdk",
            },
          },
        ] satisfies AudienceItem[],
      },
      trust: [
        "Non-custodial",
        "Подтверждение через TON-кошелек",
        "Исполнение через смарт-контракты",
        "TON-native DeFi инфраструктура",
      ],
      how: {
        title: "Как это работает",
        items: [
          {
            title: "Подключите кошелек",
            body: "STON.fi не забирает средства. Вы просто подтверждаете действия у себя в TON-кошельке.",
          },
          {
            title: "Выберите действие",
            body: "Обмен, ликвидность или интеграция ликвидности в свой продукт.",
          },
          {
            title: "Подтвердите транзакцию",
            body: "Исполнение проходит onchain, а вы контролируете каждое действие до подписи.",
          },
        ] satisfies InfoItem[],
      },
      benefitsTitle: "Что получает пользователь",
      benefits: [
        {
          title: "Прямой swap-flow",
          body: "Без перегруженной главной и без лишних объяснений перед действием.",
        },
        {
          title: "Ликвидность с контекстом",
          body: "Сначала понять пул, потом заходить в него.",
        },
        {
          title: "Кошелек как точка контроля",
          body: "Все важные действия подтверждаются пользователем.",
        },
        {
          title: "TON-native UX",
          body: "Не мост между экосистемами, а нативный опыт внутри TON.",
        },
        {
          title: "Для retail и builders",
          body: "Один протокол, но разные понятные входы для разных задач.",
        },
        {
          title: "Omniston для интеграций",
          body: "Ликвидность можно не только использовать, но и встраивать.",
        },
      ] satisfies InfoItem[],
      omniston: {
        title: "Omniston для builders",
        subtitle:
          "Если вы делаете кошелек, terminal, bot или DeFi-продукт, вам не нужен лишний frontend. Вам нужен доступ к ликвидности.",
        points: [
          "Подключайте Omniston и выводите ликвидность STON.fi в свой интерфейс.",
          "Один понятный developer-flow вместо ручной сборки маршрутов и интеграций.",
        ],
        primary: {
          label: "Открыть документацию",
          href: "https://docs.ston.fi/developer-section/omniston/sdk",
        },
        secondary: { label: "Связаться с командой", href: "https://ston.fi/" },
      },
      proof: {
        title: "STON.fi уже является частью TON DeFi",
        subtitle:
          "Главная задача этого блока не хвалиться, а убрать сомнение: это не концепт, а рабочая инфраструктура внутри экосистемы.",
        items: [
          {
            title: "TON-native DEX",
            body: "Нативный сценарий внутри экосистемы TON.",
          },
          {
            title: "Smart contracts",
            body: "Исполнение и логика происходят onchain.",
          },
          {
            title: "Wallet-based UX",
            body: "Подтверждение действий остается у пользователя.",
          },
          {
            title: "Liquidity layer",
            body: "Инфраструктура и для retail, и для builders.",
          },
        ] satisfies InfoItem[],
      },
      useCases: {
        title: "Дополнительные сценарии",
        items: [
          {
            title: "Смотреть пулы перед входом",
            body: "Не открывать LP вслепую, а сначала смотреть структуру и глубину.",
          },
          {
            title: "Добавлять ликвидность после анализа",
            body: "Переходить в liquidity flow только после понятного решения.",
          },
          {
            title: "Интегрировать liquidity routing",
            body: "Подключать маршрутизацию ликвидности в свой продукт.",
          },
          {
            title: "Использовать STON.fi как execution layer",
            body: "Опираться на рабочий onchain-слой вместо сборки с нуля.",
          },
        ] satisfies InfoItem[],
      },
      faqTitle: "FAQ",
      faq: [
        {
          question: "STON.fi хранит мои средства?",
          answer:
            "Нет. Подход non-custodial: средства остаются под контролем пользователя и кошелька.",
        },
        {
          question: "Нужна ли регистрация?",
          answer:
            "Нет. Базовый сценарий начинается с подключения TON-кошелька.",
        },
        {
          question: "Кому нужен Omniston?",
          answer:
            "Командам, которые хотят встроить ликвидность STON.fi в свой продукт.",
        },
        {
          question: "Это только для трейдеров?",
          answer:
            "Нет. Есть отдельные сценарии для LP, token issuers и developers.",
        },
      ],
      final: {
        title: "Выберите один следующий шаг",
        subtitle:
          "Не нужно изучать всё сразу. Начните с того сценария, который решает вашу задачу сегодня.",
        primary: { label: "Открыть обмен", href: ROUTES.swap },
        secondary: {
          label: "Открыть Omniston",
          href: "https://docs.ston.fi/developer-section/omniston/sdk",
        },
      },
      footer: {
        product: "Продукт",
        developers: "Разработчикам",
        trust: "Trust",
        tagline: "STON.fi — DEX и liquidity layer на TON.",
      },
    };
  }

  return {
    hero: {
      title: "DEX on TON that feels clear, fast, and wallet-first",
      subtitle:
        "Swap tokens, provide liquidity, and plug into TON DeFi infrastructure through STON.fi. Your wallet and smart contracts stay in control.",
      trust: [
        "Non-custodial: STON.fi never holds user funds",
        "Every action is confirmed through a TON wallet",
        "Execution runs through TON smart contracts",
      ],
      primary: { label: "Start swapping", href: ROUTES.swap },
      secondary: {
        label: "Explore Omniston",
        href: "https://docs.ston.fi/developer-section/omniston/sdk",
      },
    },
    audience: {
      eyebrow: "Audience",
      title: "Pick your path",
      subtitle:
        "A homepage should route action, not explain everything at once. Choose the job and move straight into it.",
      items: [
        {
          id: "swapper",
          label: "Swapper",
          value: "Swap tokens without extra steps",
          body: "Open swap, choose assets, review the quote, and confirm the trade in your wallet.",
          cta: { label: "Go to swap", href: ROUTES.swap },
        },
        {
          id: "lp",
          label: "Liquidity provider",
          value: "Liquidity with a cleaner entry point",
          body: "Browse pools, compare depth, and move into liquidity only where the route actually looks interesting.",
          cta: { label: "Open pools", href: ROUTES.pools },
        },
        {
          id: "issuer",
          label: "Token issuer",
          value: "Launch and grow token liquidity",
          body: "Bring your token into TON flow, shape liquidity, and create a clear route for traders and LPs.",
          cta: { label: "Talk listing", href: "https://ston.fi/" },
        },
        {
          id: "developer",
          label: "Developer / Omniston",
          value: "Integrate liquidity into your own product",
          body: "Use Omniston to plug STON.fi routing and liquidity into a wallet, bot, terminal, or DeFi app.",
          cta: {
            label: "Omniston docs",
            href: "https://docs.ston.fi/developer-section/omniston/sdk",
          },
        },
      ] satisfies AudienceItem[],
    },
    trust: [
      "Non-custodial",
      "Confirmed with TON wallets",
      "Executed by smart contracts",
      "TON-native DeFi infrastructure",
    ],
    how: {
      title: "How it works",
      items: [
        {
          title: "Connect your wallet",
          body: "STON.fi does not take custody. You simply confirm actions through your TON wallet.",
        },
        {
          title: "Choose the action",
          body: "Swap, liquidity, or liquidity integration inside your own product.",
        },
        {
          title: "Confirm the transaction",
          body: "Execution happens onchain, and you stay in control until you sign.",
        },
      ] satisfies InfoItem[],
    },
    benefitsTitle: "What users get",
    benefits: [
      {
        title: "Direct swap flow",
        body: "Less homepage noise and fewer explanations before action.",
      },
      {
        title: "Liquidity with context",
        body: "Understand the pool first, then decide whether to enter.",
      },
      {
        title: "Wallet stays in control",
        body: "The user confirms every important step.",
      },
      {
        title: "TON-native UX",
        body: "Not a bridge between ecosystems, but a native TON flow.",
      },
      {
        title: "Built for retail and builders",
        body: "One protocol, but different entry points for different jobs.",
      },
      {
        title: "Omniston for integrations",
        body: "Liquidity is not only usable, it is embeddable.",
      },
    ] satisfies InfoItem[],
    omniston: {
      title: "Omniston for builders",
      subtitle:
        "If you build a wallet, terminal, bot, or DeFi app, you do not need another homepage. You need liquidity access.",
      points: [
        "Plug Omniston in and surface STON.fi liquidity inside your own interface.",
        "One developer flow instead of hand-rolling routes and integrations.",
      ],
      primary: {
        label: "Open docs",
        href: "https://docs.ston.fi/developer-section/omniston/sdk",
      },
      secondary: { label: "Contact team", href: "https://ston.fi/" },
    },
    proof: {
      title: "STON.fi is already part of TON DeFi",
      subtitle:
        "This block is not here to brag. It is here to remove doubt: this is active infrastructure inside the ecosystem, not a concept.",
      items: [
        {
          title: "TON-native DEX",
          body: "Built for native execution inside TON.",
        },
        {
          title: "Smart contracts",
          body: "Execution and protocol logic live onchain.",
        },
        {
          title: "Wallet-based UX",
          body: "Confirmation remains in the user wallet.",
        },
        {
          title: "Liquidity layer",
          body: "Infrastructure for both retail and builders.",
        },
      ] satisfies InfoItem[],
    },
    useCases: {
      title: "Secondary use cases",
      items: [
        {
          title: "Review pools before entering",
          body: "Avoid blind LP flow and look at structure first.",
        },
        {
          title: "Provide liquidity after analysis",
          body: "Move to liquidity only once the route makes sense.",
        },
        {
          title: "Integrate liquidity routing",
          body: "Bring routing into your own product.",
        },
        {
          title: "Use STON.fi as execution layer",
          body: "Build on a working onchain layer instead of starting from zero.",
        },
      ] satisfies InfoItem[],
    },
    faqTitle: "FAQ",
    faq: [
      {
        question: "Does STON.fi hold my funds?",
        answer:
          "No. It is non-custodial, so funds stay under user and wallet control.",
      },
      {
        question: "Do I need to register?",
        answer: "No. The basic flow starts with connecting a TON wallet.",
      },
      {
        question: "Who needs Omniston?",
        answer:
          "Teams that want to embed STON.fi liquidity into their own product.",
      },
      {
        question: "Is this only for traders?",
        answer:
          "No. There are clear paths for LPs, token issuers, and developers too.",
      },
    ],
    final: {
      title: "Choose one next step",
      subtitle:
        "You do not need to learn everything at once. Start with the scenario that solves your job today.",
      primary: { label: "Open swap", href: ROUTES.swap },
      secondary: {
        label: "Open Omniston",
        href: "https://docs.ston.fi/developer-section/omniston/sdk",
      },
    },
    footer: {
      product: "Product",
      developers: "Developers",
      trust: "Trust",
      tagline: "STON.fi is a DEX and liquidity layer on TON.",
    },
  };
}

export function HomePage() {
  const { language } = useI18n();
  const copy = useMemo(() => getHomeCopy(language), [language]);

  const footerColumns = useMemo<FooterColumn[]>(
    () => [
      {
        title: copy.footer.product,
        links: [
          { label: "Swap", href: ROUTES.swap },
          { label: "Pools", href: ROUTES.pools },
          { label: "Liquidity", href: ROUTES.liquidityProvide },
          {
            label: "Omniston",
            href: "https://docs.ston.fi/developer-section/omniston/sdk",
          },
        ],
      },
      {
        title: copy.footer.developers,
        links: [
          { label: "Docs", href: "https://docs.ston.fi/" },
          { label: "API", href: "https://docs.ston.fi/" },
          {
            label: "Integrations",
            href: "https://docs.ston.fi/developer-section/omniston/sdk",
          },
        ],
      },
      {
        title: copy.footer.trust,
        links: [
          { label: "Smart contracts", href: "https://docs.ston.fi/" },
          { label: "Wallet-based flow", href: "https://ston.fi/" },
          { label: "TON-native", href: "https://ston.fi/" },
        ],
      },
    ],
    [copy.footer],
  );

  return (
    <div className="flex flex-col gap-2">
      <HeroSection
        title={copy.hero.title}
        subtitle={copy.hero.subtitle}
        trustPoints={copy.hero.trust}
        primaryCta={copy.hero.primary}
        secondaryCta={copy.hero.secondary}
      />

      <AudienceSwitcher
        items={copy.audience.items}
        eyebrow={copy.audience.eyebrow}
        title={copy.audience.title}
        subtitle={copy.audience.subtitle}
      />
      <TrustStrip items={copy.trust} />
      <HowItWorks items={copy.how.items} title={copy.how.title} />
      <BenefitsGrid items={copy.benefits} title={copy.benefitsTitle} />
      <OmnistonSection
        title={copy.omniston.title}
        subtitle={copy.omniston.subtitle}
        points={copy.omniston.points}
        primaryCta={copy.omniston.primary}
        secondaryCta={copy.omniston.secondary}
      />
      <EcosystemProof
        items={copy.proof.items}
        title={copy.proof.title}
        subtitle={copy.proof.subtitle}
      />
      <UseCaseLinks items={copy.useCases.items} title={copy.useCases.title} />
      <FAQSection items={copy.faq} title={copy.faqTitle} />
      <FinalCTA
        title={copy.final.title}
        subtitle={copy.final.subtitle}
        primaryCta={copy.final.primary}
        secondaryCta={copy.final.secondary}
      />
      <Footer columns={footerColumns} tagline={copy.footer.tagline} />
    </div>
  );
}
