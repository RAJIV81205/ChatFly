"use client";

import { useEffect, useMemo, useState } from "react";
import { getEmojis, EmojiItem ,EMOJI_GROUPS, EmojiGroup } from "@/lib/emojiStore";

interface Props {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: Props) {
  const [allEmojis, setAllEmojis] = useState<EmojiItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] =
    useState<EmojiGroup>("smileys-emotion");

  useEffect(() => {
    getEmojis().then(setAllEmojis);
  }, []);

  // Group → Subgroup → Emojis
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, EmojiItem[]>> = {};

    allEmojis.forEach(e => {
      if (!map[e.group]) map[e.group] = {};
      if (!map[e.group][e.subgroup]) map[e.group][e.subgroup] = [];
      map[e.group][e.subgroup].push(e);
    });

    return map;
  }, [allEmojis]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();

    return allEmojis.filter(e =>
      e.annotation.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q)) ||
      e.shortcodes.some(s => s.toLowerCase().includes(q))
    );
  }, [search, allEmojis]);

  return (
    <div className="w-80 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">

      {/* Search */}
      <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emojis…"
          className="w-full rounded-lg px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 focus:outline-none"
        />
      </div>

      {/* Groups */}
      {!search && (
        <div className="flex gap-1 px-2 py-1 overflow-x-auto">
          {(Object.keys(EMOJI_GROUPS) as EmojiGroup[]).map(group => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-2 py-1 text-xs rounded-md whitespace-nowrap ${
                activeGroup === group
                  ? "bg-emerald-500 text-white"
                  : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {EMOJI_GROUPS[group].icon}
            </button>
          ))}
        </div>
      )}

      {/* Emojis */}
      <div className="max-h-64 overflow-y-auto p-2">
        {searchResults ? (
          <EmojiGrid emojis={searchResults} onSelect={onSelect} />
        ) : (
          Object.entries(grouped[activeGroup] || {}).map(
            ([subgroup, emojis]) => (
              <div key={subgroup} className="mb-2">
                <div className="text-xs text-zinc-500 mb-1">
                  {subgroup.replaceAll("-", " ")}
                </div>
                <EmojiGrid emojis={emojis} onSelect={onSelect} />
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

function EmojiGrid({
  emojis,
  onSelect,
}: {
  emojis: EmojiItem[];
  onSelect: (e: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1">
      {emojis.map(e => (
        <button
          key={e.emoji}
          onClick={() => onSelect(e.emoji)}
          className="text-xl rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title={e.annotation}
        >
          {e.emoji}
        </button>
      ))}
    </div>
  );
}
