import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import ThemedToaster from "@/components/ThemedToaster";

export const metadata: Metadata = {
  title: "Ping",
  description: "Chit Chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemedToaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
