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
        "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950",
        pathname === props.href &&
          "bg-[linear-gradient(135deg,#082f49,#0369a1)] text-white shadow-[0_16px_34px_-18px_rgba(3,105,161,0.85)]",
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
      <ul className="mx-auto flex max-w-6xl flex-wrap gap-2 rounded-[28px] border border-white/70 bg-white/70 p-2 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        {links.map(({ label, href }) => (
          <li key={href}>
            <NavBarLink href={href}>{label}</NavBarLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
