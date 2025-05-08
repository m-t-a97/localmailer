import type { PropsWithChildren } from "react";

import type { Metadata } from "next";

import "./globals.css";
import Providers from "./Providers";
import { primaryFont } from "@/config/fonts";

export const metadata: Metadata = {
  title: "LocalMailer",
  description: "A local email client for development.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={primaryFont.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
