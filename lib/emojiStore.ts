export const EMOJI_GROUPS = {
  "smileys-emotion": {
    label: "😀 Smileys",
    icon: "😀",
  },
  "people-body": {
    label: "🧑 People",
    icon: "🧑",
  },
  component: {
    label: "🧩 Components",
    icon: "🧩",
  },
  "animals-nature": {
    label: "🐻 Animals",
    icon: "🐻",
  },
  "food-drink": {
    label: "🍔 Food",
    icon: "🍔",
  },
  "travel-places": {
    label: "✈️ Travel",
    icon: "✈️",
  },
  activities: {
    label: "⚽ Activities",
    icon: "⚽",
  },
  objects: {
    label: "💡 Objects",
    icon: "💡",
  },
  symbols: {
    label: "❤️ Symbols",
    icon: "❤️",
  },
} as const;

export type EmojiGroup = keyof typeof EMOJI_GROUPS;

export interface EmojiItem {
  emoji: string;
  group: EmojiGroup;
  subgroup: string;
  annotation: string;
  tags: string[];
  shortcodes: string[];
}

const CACHE_KEY = "__emoji_family_cache__";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

let memoryCache: EmojiItem[] | null = null;

export async function getEmojis(): Promise<EmojiItem[]> {
  // In-memory cache (fastest)
  if (memoryCache) return memoryCache;

  // localStorage cache (client-only)
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        memoryCache = parsed.data;
        return parsed.data;
      }
    }
  }

  // 🔥 FETCH FROM PROXY (NO CORS)
  const res = await fetch("/api/emojis");
  if (!res.ok) throw new Error("Failed to load emojis");

  const raw = await res.json();

  const emojis: EmojiItem[] = raw
    .filter(
      (e: any) =>
        e.group && e.group in EMOJI_GROUPS // 🔐 type safety
    )
    .map((e: any) => ({
      emoji: e.emoji,
      group: e.group as EmojiGroup,
      subgroup: e.subgroup || "",
      annotation: e.annotation || "",
      tags: e.tags || [],
      shortcodes: e.shortcodes || [],
    }));

  // Persist cache
  if (typeof window !== "undefined") {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: emojis,
      })
    );
  }

  memoryCache = emojis;
  return emojis;
}
