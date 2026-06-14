"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

import { Mail, Pen, Settings } from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

const navItems = [
  { href: "/", label: "Inbox", icon: Mail },
  { href: "/compose", label: "Compose", icon: Pen },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavContent({ pathname }: { pathname: string }) {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <nav className="mt-14 flex h-full flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const isActiveItem = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-2 py-2 text-sm font-medium rounded-none rounded-r-lg transition-all duration-200 pl-3",
              isActiveItem
                ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary pl-2.5"
                : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:border-l-2 hover:border-sidebar-primary/50 hover:pl-2.5",
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="h-5 w-5 text-sidebar-foreground/70 group-hover:text-sidebar-foreground transition-colors duration-200" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <div className="flex">
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-56 p-4">
          <NavContent pathname={pathname} />
        </SheetContent>
      </Sheet>

      <aside className="hidden lg:flex lg:w-56 min-h-screen flex-col bg-sidebar/50 p-4 border-r border-border">
        <NavContent pathname={pathname} />
      </aside>

      <main className="flex-1 mt-14 p-6">
        {children}
      </main>
    </div>
  );
}
