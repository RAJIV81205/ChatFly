"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun , Moon } from "lucide-react";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <nav className="w-full px-6 pt-6">
      <div className="mx-auto max-w-7xl rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 font-semibold text-lg text-zinc-900 dark:text-white">
          <span className="inline-block w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white" />
          Ping
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-600 dark:text-zinc-300">
          <a className="hover:text-zinc-900 dark:hover:text-white transition-colors" href="#">
            Features
          </a>
          <a className="hover:text-zinc-900 dark:hover:text-white transition-colors" href="#">
            Communities
          </a>
          <a className="hover:text-zinc-900 dark:hover:text-white transition-colors" href="#">
            Events
          </a>
          <a className="hover:text-zinc-900 dark:hover:text-white transition-colors" href="#">
            About Us
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
         

          <button title="Login" className="rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
            Login →
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="ml-2 h-9 w-9 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}
