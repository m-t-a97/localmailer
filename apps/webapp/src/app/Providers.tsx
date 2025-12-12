"use client";

import { PropsWithChildren } from "react";

import { Toaster } from "react-hot-toast";

import Navbar from "@/components/core/Navbar";
import Sidebar from "@/components/core/Sidebar";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar />
      <Sidebar>{children}</Sidebar>
      <Toaster
        position="bottom-right"
        gutter={15}
        toastOptions={{
          duration: 3000,
        }}
      />
    </>
  );
}
