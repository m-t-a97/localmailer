"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { PropsWithChildren } from "react";

import { Mail, Pen, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inbox", icon: Mail },
  { href: "/compose", label: "Compose", icon: Pen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {/* Page content */}
        <div className="mt-12">
          <>{children}</>
        </div>
      </div>

      <div className="drawer-side">
        <label
          htmlFor="drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />

        <ul className="menu min-h-full w-20 bg-gray-100 p-4">
          {/* Sidebar content */}
          <div className="mt-14 flex h-full flex-1 flex-col gap-5">
            {navItems.map((item) => {
              const isActiveItem = pathname === item.href;

              return (
                <li
                  key={item.href}
                  className="flex flex-row items-center justify-start last:mt-auto"
                >
                  <Link
                    href={item.href}
                    className={cn("w-full", isActiveItem && "bg-gray-300")}
                  >
                    <span>
                      <item.icon className="h-5 w-5 text-black" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </div>
        </ul>
      </div>
    </div>
  );
}
