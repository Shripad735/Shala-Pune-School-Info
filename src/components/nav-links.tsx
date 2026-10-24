"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/schools", label: "Explore" },
  { href: "/areas", label: "Areas" },
  { href: "/near", label: "Near me" },
  { href: "/compare", label: "Compare" },
];

export function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className={
        compact
          ? "flex items-center justify-center gap-1"
          : "hidden items-center gap-1 md:flex"
      }
    >
      {LINKS.map((link) => {
        const active =
          pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
        return (
          <Link
            key={link.href}
            href={link.href}
            data-active={active}
            aria-current={active ? "page" : undefined}
            className="rounded-full px-3.5 py-1.5 text-[0.84rem] font-medium text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink data-[active=true]:bg-ink data-[active=true]:text-paper"
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
