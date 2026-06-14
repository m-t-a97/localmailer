"use client";

import { PropsWithChildren } from "react";

import { Toaster } from "sonner";

import Navbar from "@/components/core/Navbar";
import Sidebar from "@/components/core/Sidebar";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar />
      <Sidebar>{children}</Sidebar>
      <Toaster
        position="bottom-right"
        duration={3000}
      />
    </>
  );
}
