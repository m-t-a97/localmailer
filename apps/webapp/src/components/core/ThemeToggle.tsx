"use client";

import { useState } from "react";

import { Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);

  const toggleTheme = (): void => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="border-border"
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
    </Button>
  );
}
