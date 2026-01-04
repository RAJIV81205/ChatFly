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
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <aside className="h-screen w-20 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-between py-6">
      
      {/* Logo */}
      <div className="flex flex-col items-center gap-8">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-bold text-lg">
          P
        </div>

        
      </div>


      {/* Main Icons */}
        <nav className="flex flex-col items-center gap-6">
          <IconButton icon={<MessageCircleMore />} link={"/dashboard"} isActive={pathname === "/dashboard"} />
          <IconButton icon={<Phone />} link={"/dashboard/call"} isActive={pathname === "/dashboard/call"} />
          <IconButton icon={<Video />} link={"/dashboard/vcall"} isActive={pathname === "/dashboard/vcall"} />
        </nav>

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-6">
        <IconButton icon={<Settings />} link={"/dashboard/settings"} isActive={pathname === "/dashboard/settings"} />

        {/* Theme Toggle */}
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
/* Reusable Icon Button */
/* ---------------------------------- */
const IconButton = ({ icon, link, isActive }: { icon: React.ReactNode, link?: string, isActive?: boolean }) => {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => link && router.replace(link)} 
      className={`p-3 rounded-xl transition ${
        isActive 
          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
      }`}
    >
      {icon}
    </button>
  );
};
