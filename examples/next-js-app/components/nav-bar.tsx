"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NavBarLink: React.FC<React.ComponentPropsWithoutRef<typeof Link>> = (
  props,
) => {
  const pathname = usePathname();

  return (
    <Link
      {...props}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:text-slate-950",
        pathname === props.href &&
          "bg-[linear-gradient(135deg,#082f49,#0369a1)] text-white shadow-[0_18px_38px_-18px_rgba(3,105,161,0.85)]",
        props.className,
      )}
    />
  );
};

export const NavBar: React.FC<
  Omit<React.ComponentPropsWithoutRef<"nav">, "children"> & {
    links: Array<{ href: string; label: string }>;
  }
> = ({ links, ...props }) => {
  return (
    <nav {...props} className={cn("w-full px-4 pb-2 pt-4", props.className)}>
      <ul className="mx-auto flex max-w-6xl flex-wrap gap-2 rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.66))] p-2 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        {links.map(({ label, href }) => (
          <li key={href}>
            <NavBarLink href={href}>{label}</NavBarLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
