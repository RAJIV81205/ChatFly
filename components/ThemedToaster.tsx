"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

function ToastInner() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <Toaster
      position="top-center"
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? "#1f2937" : "#ffffff",
          color: isDark ? "#f9fafb" : "#111827",
          border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: isDark
            ? "0 4px 12px rgba(0,0,0,0.45)"
            : "0 4px 12px rgba(0,0,0,0.08)",
        },
        success: {
          iconTheme: {
            primary: isDark ? "#4ade80" : "#16a34a",
            secondary: isDark ? "#1f2937" : "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: isDark ? "#f87171" : "#dc2626",
            secondary: isDark ? "#1f2937" : "#ffffff",
          },
        },
      }}
    />
  );
}

export default function ThemedToaster() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ToastInner />
    </ThemeProvider>
  );
}
