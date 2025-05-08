import Image from "next/image";
import Link from "next/link";

import { Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 z-20 mb-10 w-full border-b backdrop-blur-sm">
      <div className="flex h-14 w-full items-center px-4">
        <div className="flex w-full flex-row items-center justify-start gap-2">
          <label htmlFor="drawer" className="lg:hidden">
            <Menu />
          </label>

          <Link href="/" className="flex items-center space-x-2">
            <Image src="/app-icon.png" height={40} width={40} alt="App Logo" />
            <span className="text-base font-semibold">LocalMailer</span>
          </Link>

          {/* TODO: need to fix the theme on as some components still display white even in dark mode */}
          {/* <ThemeToggle /> */}
          <div></div>
        </div>
      </div>
    </header>
  );
}
