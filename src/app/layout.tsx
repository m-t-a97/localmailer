import "./globals.css";

import type { PropsWithChildren } from "react";
import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/core/Navbar";
import { primaryFont } from "@/config/fonts";

export const metadata: Metadata = {
  title: "LocalMailer",
  description: "A local email client for development.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={primaryFont.className} suppressHydrationWarning>
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
