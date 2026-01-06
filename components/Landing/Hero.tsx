"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  MessageCircle,
  Search,
  MoreVertical,
  CheckCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter()

  useEffect(() => {
    if (!heroRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    tl.to(heroRef.current, {
      opacity: 1,
      duration: 0.6,
    })
      .to(
        ".hero-text",
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
        },
        "-=0.3"
      )
      .to(
        ".chat-card",
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
        },
        "-=0.2"
      )
      .to(
        ".chat-msg",
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
        },
        "-=0.3"
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="px-4 sm:px-6 pt-8">
      <div
        ref={heroRef}
        className="opacity-0 relative mx-auto max-w-8xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        {/* TEXT */}
        <div className="hero-text opacity-0 translate-y-6 relative z-10 px-6 pt-16 pb-80 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Find Your Tribe,
            <br />
            Build Your Network.
          </h1>

          <p className="mt-6 text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto">
            Fast, private, real-time chats with people who actually share
            your interests.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
            onClick={()=>router.push("/auth/login")} 
            className="rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-3 text-sm font-medium flex items-center gap-2 cursor-pointer">
              <MessageCircle size={16} />
              Start Chatting
            </button>

            <button className="rounded-full border border-zinc-300 dark:border-zinc-700 px-6 py-3 text-sm font-medium">
              Explore Communities
            </button>
          </div>
        </div>

        {/* CHAT PREVIEW */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChatCard
              name="Aman"
              online
              messages={[
                "Anyone joining the hackathon this weekend?",
                "Looking for frontend teammates 👀",
              ]}
            />

            <ChatCard
              name="You"
              right
              messages={[
                "I'm in! 🚀",
                "Next.js + Tailwind?",
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CHAT CARD ---------------- */

function ChatCard({
  name,
  messages,
  online,
  right,
}: {
  name: string;
  messages: string[];
  online?: boolean;
  right?: boolean;
}) {
  return (
    <div
      className={`chat-card opacity-0 translate-y-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4 shadow-sm ${
        right ? "md:mt-12" : ""
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-full bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center text-sm font-semibold">
            {name[0]}
            {online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-zinc-50 dark:border-zinc-800" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {name}
            </p>
            <p className="text-xs text-zinc-500">
              {online ? "Online" : "Typing…"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 text-zinc-400">
          <Search size={16} />
          <MoreVertical size={16} />
        </div>
      </div>

      {/* MESSAGES */}
      <div
        className={`space-y-2 flex ${
          right ? "flex-col items-end" : "flex-col"
        }`}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg opacity-0 translate-y-3 max-w-[75%] rounded-xl px-4 py-2 text-sm ${
              right
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"
            }`}
          >
            <div className="flex items-end gap-2">
              <span>{msg}</span>
              {right && <CheckCheck size={14} className="opacity-70" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
