"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="px-6 pt-8">
      <div className="relative mx-auto max-w-8xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Text content */}
        <div className="relative z-10 px-6 pt-20 pb-72 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Find Your Tribe,
            <br />
            Build Your Network.
          </h1>

          <p className="mt-6 text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto">
            Connect with like-minded students for fun,
            friendships, and future opportunities.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button className="rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-3 text-sm font-medium hover:opacity-90 transition">
              Join for Free →
            </button>

            <button className="rounded-full border border-zinc-300 dark:border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
              Explore Communities
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="absolute bottom-0 left-0 right-0">
          <Image
            src="/hero.jp"  // put the image in /public/hero.png
            alt="Community"
            width={1400}
            height={600}
            className="w-full object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
