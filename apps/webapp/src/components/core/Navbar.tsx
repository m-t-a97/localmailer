"use client";

import Image from "next/image";
import Link from "next/link";

import { Menu } from "lucide-react";

import { useUiStore } from "@/stores/ui-store";

export default function Navbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header className="fixed top-0 left-0 z-20 mb-10 w-full bg-background/70 backdrop-blur-xl border-b border-border/50 shadow-xs">
      <div className="flex h-14 w-full items-center px-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl p-2 hover:bg-accent transition-colors duration-200 lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu />
            </button>

            <Link href="/" className="flex items-center space-x-2">
              <Image src="/app-icon.png" height={40} width={40} alt="App Logo" />
              <span className="text-base font-semibold">LocalMailer</span>
            </Link>
          </div>

          {/* TODO: need to fix the theme on as some components still display white even in dark mode */}
          {/* <ThemeToggle /> */}
        </div>
      </div>
    </header>
  );
}
