"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  status: string;
  narrativeId?: string;
  commitmentId?: string;
}

interface SearchResults {
  narratives: SearchResult[];
  commitments: SearchResult[];
  tasks: SearchResult[];
}

interface PaletteItem {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: string;
}

const QUICK_ACTIONS: PaletteItem[] = [
  {
    id: "qa-new-narrative",
    title: "New Narrative",
    category: "Quick Actions",
    href: "/dashboard/narratives/new",
    icon: "+",
  },
  {
    id: "qa-dashboard",
    title: "Dashboard",
    category: "Quick Actions",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    id: "qa-strategy",
    title: "Strategy",
    category: "Quick Actions",
    href: "/dashboard/strategy",
    icon: "◆",
  },
  {
    id: "qa-alignment",
    title: "Alignment",
    category: "Quick Actions",
    href: "/dashboard/alignment",
    icon: "◎",
  },
];

const RECENT_KEY = "ncts-command-palette-recent";
const MAX_RECENT = 5;

function getRecentItems(): PaletteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentItem(item: PaletteItem) {
  try {
    const recent = getRecentItems().filter((r) => r.id !== item.id);
    recent.unshift(item);
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT)),
    );
  } catch {
    // Ignore storage errors
  }
}

function resultsToPaletteItems(results: SearchResults): PaletteItem[] {
  const items: PaletteItem[] = [];

  for (const n of results.narratives) {
    items.push({
      id: n.id,
      title: n.title,
      category: "Narratives",
      href: `/dashboard/narratives/${n.id}`,
      icon: "N",
    });
  }

  for (const c of results.commitments) {
    items.push({
      id: c.id,
      title: c.title,
      category: "Commitments",
      href: `/dashboard/commitments/${c.id}`,
      icon: "C",
    });
  }

  for (const t of results.tasks) {
    items.push({
      id: t.id,
      title: t.title,
      category: "Tasks",
      href: `/dashboard/commitments/${t.commitmentId}`,
      icon: "T",
    });
  }

  return items;
}

// ─── Category Badge ──────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Narratives: "bg-blue-100 text-blue-700",
    Commitments: "bg-amber-100 text-amber-700",
    Tasks: "bg-green-100 text-green-700",
    "Quick Actions": "bg-navy-100 text-navy-600",
    Recent: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${colors[category] || "bg-navy-100 text-navy-600"}`}
    >
      {category}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PaletteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the display list: search results + quick actions, or recent + quick actions
  const displayItems = query.trim()
    ? items
    : [...getRecentItems().map((r) => ({ ...r, category: "Recent" })), ...QUICK_ACTIONS];

  // Open / close
  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setItems([]);
    setSelectedIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setItems([]);
  }, []);

  // Navigate to item
  const navigateTo = useCallback(
    (item: PaletteItem) => {
      saveRecentItem(item);
      closePalette();
      router.push(item.href);
    },
    [closePalette, router],
  );

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, openPalette, closePalette]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to let the modal render
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setItems([]);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data: SearchResults) => {
          const paletteItems = resultsToPaletteItems(data);
          // Append quick actions that match the query
          const matchingActions = QUICK_ACTIONS.filter((a) =>
            a.title.toLowerCase().includes(trimmed.toLowerCase()),
          );
          setItems([...paletteItems, ...matchingActions]);
          setSelectedIndex(0);
        })
        .catch(() => {
          setItems([]);
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Clamp selected index when items change
  useEffect(() => {
    if (selectedIndex >= displayItems.length) {
      setSelectedIndex(Math.max(0, displayItems.length - 1));
    }
  }, [displayItems.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`,
    );
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Keyboard navigation inside the palette
  function handlePaletteKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, displayItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = displayItems[selectedIndex];
      if (item) navigateTo(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    }
  }

  if (!open) return null;

  // Group items by category for display
  const grouped: Record<string, PaletteItem[]> = {};
  for (const item of displayItems) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  // Flat index mapping for keyboard navigation
  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onClick={closePalette}
      onKeyDown={handlePaletteKeyDown}
    >
      <div
        className="mx-auto mt-[20vh] max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="border-b border-navy-100 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to..."
            className="w-full bg-transparent text-lg text-navy-950 placeholder-navy-400 outline-none"
          />
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto overscroll-contain px-2 py-2"
        >
          {loading && query.trim() && (
            <p className="px-3 py-4 text-center text-sm text-navy-400">
              Searching...
            </p>
          )}

          {!loading && query.trim() && displayItems.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-navy-400">
              No results found for &ldquo;{query}&rdquo;
            </p>
          )}

          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category} className="mb-2">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                {category}
              </p>
              {categoryItems.map((item) => {
                const idx = flatIndex++;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    data-index={idx}
                    onClick={() => navigateTo(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-amber-50 text-navy-950"
                        : "text-navy-600 hover:bg-navy-50"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold ${
                        isSelected
                          ? "bg-amber-500 text-white"
                          : "bg-navy-100 text-navy-600"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.title}</span>
                    <CategoryBadge category={item.category} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-navy-100 px-4 py-2">
          <p className="text-[11px] text-navy-400">
            <kbd className="rounded border border-navy-200 bg-navy-50 px-1 py-0.5 text-[10px] font-medium">
              ↑↓
            </kbd>{" "}
            to navigate{" "}
            <kbd className="rounded border border-navy-200 bg-navy-50 px-1 py-0.5 text-[10px] font-medium">
              ↵
            </kbd>{" "}
            to select{" "}
            <kbd className="rounded border border-navy-200 bg-navy-50 px-1 py-0.5 text-[10px] font-medium">
              esc
            </kbd>{" "}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}
