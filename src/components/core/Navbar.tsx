"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Inbox" },
    { href: "/compose", label: "Compose" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 mb-10 w-full border-b backdrop-blur-sm">
      <div className="max-page-width flex w-full items-center p-3">
        <div className="flex w-full flex-row items-center justify-between gap-5">
          <Link href="/" className="flex items-center space-x-2">
            <Mail className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              LocalMailer
            </span>
          </Link>

          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "hover:text-foreground/80 transition-colors",
                  pathname === href
                    ? "font-semibold text-blue-700"
                    : "text-foreground/60",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
