"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

type NavItem = {
  href: string;
  label: string;
};

type DashboardNavProps = {
  items: NavItem[];
};

export function DashboardNav({ items }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 relative",
              active
                ? "bg-white text-gray-900 shadow-md font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            )}
          >
            {item.label}
            {active && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
