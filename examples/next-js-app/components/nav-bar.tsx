"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const NavBarLink: React.FC<React.ComponentPropsWithoutRef<typeof Link>> = (
  props,
) => {
  const pathname = usePathname();

  return (
    <Link
      {...props}
      className={cn(
        "rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-50 hover:text-slate-900",
        pathname === props.href &&
          "bg-[linear-gradient(135deg,#0180FF,#7354F2)] text-white shadow-[0_18px_38px_-18px_rgba(1,128,255,0.48)]",
        props.className,
      )}
    />
  );
};

export const NavBar: React.FC<
  Omit<React.ComponentPropsWithoutRef<"nav">, "children"> & {
    links: Array<{ href: string; labelKey: string }>;
  }
> = ({ links, ...props }) => {
  const { t } = useI18n();

  return (
    <nav {...props} className={cn("w-full px-4 pb-2 pt-4", props.className)}>
      <ul className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto rounded-[30px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,249,255,0.92))] p-1.5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.12)] backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map(({ labelKey, href }) => (
          <li key={href}>
            <NavBarLink
              href={href}
              className="min-w-[96px] whitespace-nowrap text-center"
            >
              {t(labelKey)}
            </NavBarLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
