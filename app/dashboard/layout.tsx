"use client";

import Sidebar from "@/components/Dashboard/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "GET",
          credentials: "include", // 🔑 sends cookies
        });

        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const data = await res.json();

        if (data.valid) {
          setIsVerified(true);
          localStorage.setItem("username",data.username);
        } else {
          router.replace("/auth/login");
          localStorage.clear() 
        }
      } catch (error) {
        router.replace("/auth/login");
        localStorage.clear()
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [router]);

  // ⛔ Prevent UI flash
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <span className="text-zinc-500">Verifying session...</span>
      </div>
    );
  }

  if (!isVerified) return null;

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
