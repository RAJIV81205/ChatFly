"use client";

import {
  MessageCircleMore,
  Phone,
  Video,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";

const navItems = [
  { id: "chat", icon: <MessageCircleMore />, link: "/dashboard" },
  { id: "call", icon: <Phone />, link: "/dashboard/call" },
  { id: "vcall", icon: <Video />, link: "/dashboard/vcall" },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  /* ------------------ Mount ------------------ */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* -------- Subtle stagger on mount -------- */
  useEffect(() => {
    if (!mounted || !navRef.current) return;

    gsap.fromTo(
      navRef.current.children,
      { opacity: 0, scale: 0.96 },
      {
        opacity: 1,
        scale: 1,
        stagger: 0.05,
        duration: 0.35,
        ease: "power2.out",
        clearProps: "transform",
      }
    );
  }, [mounted]);

  /* -------- Premium active indicator -------- */
  useEffect(() => {
    if (!mounted || !navRef.current || !indicatorRef.current) return;

    const index = navItems.findIndex(
      (item) => item.link === pathname
    );
    if (index === -1) return;

    const btn = navRef.current.children[index] as HTMLElement;

    gsap.to(indicatorRef.current, {
      y: btn.offsetTop,
      height: btn.offsetHeight,
      duration: 0.45,
      ease: "expo.out", // ← key improvement
    });

    // Active icon micro-scale
    gsap.to(btn, {
      scale: 1.06,
      duration: 0.25,
      ease: "power2.out",
    });

    // Reset others
    gsap.to(
      Array.from(navRef.current.children).filter(
        (_, i) => i !== index
      ),
      {
        scale: 1,
        duration: 0.2,
      }
    );
  }, [pathname, mounted]);

  if (!mounted) return <aside className="h-screen w-20" />;

  return (
    <aside className="h-screen w-20 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-between py-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-8">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-bold text-lg">
          P
        </div>
      </div>

      {/* Navigation */}
      <div className="relative">
        <div
          ref={indicatorRef}
          className="absolute left-0 w-full rounded-xl bg-zinc-900 dark:bg-white z-0"
        />

        <nav
          ref={navRef}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          {navItems.map((item) => (
            <IconButton
              key={item.id}
              icon={item.icon}
              link={item.link}
              isActive={pathname === item.link}
            />
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-6">
        <IconButton
          icon={<Settings />}
          link="/dashboard/settings"
          isActive={pathname === "/dashboard/settings"}
        />

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-zinc-300" />
          ) : (
            <Moon className="h-5 w-5 text-zinc-700" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

/* ---------------------------------- */
const IconButton = ({
  icon,
  link,
  isActive,
}: {
  icon: React.ReactNode;
  link?: string;
  isActive?: boolean;
}) => {
  const router = useRouter();

  return (
    <button
      onClick={() => link && router.replace(link)}
      className={`p-3 rounded-xl transition relative ${
        isActive
          ? "text-white dark:text-zinc-900"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
      }`}
    >
      {icon}
    </button>
  );
};
