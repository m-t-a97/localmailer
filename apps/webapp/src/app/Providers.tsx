"use client";

import { PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import Navbar from "@/components/core/Navbar";
import Sidebar from "@/components/core/Sidebar";
import { queryClient } from "@/lib/react-query";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Navbar />
        <Sidebar>{children}</Sidebar>
      </QueryClientProvider>
      <Toaster position="bottom-right" duration={3000} />
    </>
  );
}
