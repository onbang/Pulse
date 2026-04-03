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
        "rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/8 hover:text-white",
        pathname === props.href &&
          "bg-[linear-gradient(135deg,#111827,#2563eb)] text-white shadow-[0_18px_38px_-18px_rgba(37,99,235,0.75)]",
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
      <ul className="mx-auto flex max-w-6xl flex-wrap gap-2 rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.62))] p-2 shadow-[0_24px_80px_-44px_rgba(2,6,23,0.9)] backdrop-blur-2xl">
        {links.map(({ label, href }) => (
          <li key={href}>
            <NavBarLink href={href}>{label}</NavBarLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
