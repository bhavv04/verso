"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import SwipeStack from "@/components/SwipeStack";
import { Book } from "@/lib/books";
import { BookOpen, Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

const CACHE_KEY = "verso_feed";
const CACHE_TTL = 45 * 60 * 1000;

function getCache(): Book[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const { books, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return []; }
    return books ?? [];
  } catch { return []; }
}

function setCache(books: Book[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ books, ts: Date.now() })); } catch {}
}

function popCache(n: number): Book[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const popped = parsed.books.slice(-n);
    parsed.books = parsed.books.slice(0, -n);
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    return popped;
  } catch { return []; }
}

function cacheSize(): number {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw).books.length : 0;
  } catch { return 0; }
}

async function getShelfIds(): Promise<Set<string>> {
  try {
    const res = await fetch("/api/shelf");
    const data = await res.json();
    return new Set((data.books ?? []).map((b: any) => b.googleBooksId));
  } catch {
    return new Set();
  }
}

const BATCH = 30;

let sessionInitialized = false;
let cachedStack: Book[] = [];

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Finding books for you...");
  const fetching = useRef(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (isLoaded && !user) router.push("/sign-in");
  }, [isLoaded, user]);

  useEffect(() => {
    if (user) {
      fetch("/api/user", { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (sessionInitialized && cachedStack.length > 0) {
            setBooks(cachedStack);
            setLoading(false);
            return;
          }
          if (sessionInitialized) return;
          sessionInitialized = true;
          const userGenres = data.user?.genres ?? [];
          if (userGenres.length === 0) router.push("/onboarding");
          else loadBooks(false);
        });
    }
  }, [user]);

  const fetchFeed = useCallback(async (attempt = 0): Promise<Book[]> => {
    if (fetching.current) return [];
    fetching.current = true;
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      const books: Book[] = data.books ?? [];
      if (books.length === 0 && attempt < 3) {
        fetching.current = false;
        await new Promise((r) => setTimeout(r, 1500));
        return fetchFeed(attempt + 1);
      }
      setCache(books);
      return books;
    } catch {
      fetching.current = false;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500));
        return fetchFeed(attempt + 1);
      }
      return [];
    } finally {
      fetching.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    const loadBooks = useCallback(async (fromEmpty: boolean) => {
    const shelfIds = await getShelfIds();

    const cached = getCache();
    if (cached.length >= BATCH) {
        const batch = popCache(BATCH).filter((b) => !shelfIds.has(b.id));
        cachedStack = batch;
        setBooks(batch);
        setLoading(false);
        if (cacheSize() < 10) fetchFeed();
        return;
    }

    if (!fromEmpty) setLoadingMsg("Building your feed...");
    setLoading(true);

    const fresh = await fetchFeed();
    if (fresh.length > 0) {
        const batch = popCache(BATCH);
        const finalBatch = (batch.length > 0 ? batch : fresh.slice(0, BATCH))
        .filter((b) => !shelfIds.has(b.id));
        cachedStack = finalBatch;
        setBooks(finalBatch);
    } else {
        setBooks([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0f0e0c] text-[#1a1a2e] dark:text-[#f0ece4] flex flex-col">
      <nav className="flex items-center justify-between px-8 py-4 bg-white dark:bg-[#1a1916] border-b border-[#e8e4dc] dark:border-[#2a2825] sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] dark:bg-[#f0ece4] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white dark:text-[#1a1a2e]" />
          </div>
          <span className="font-bold text-lg tracking-tight">verso</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/shelf")}
            className="text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-[#1a1a2e] dark:hover:text-[#f0ece4] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0ece4] dark:hover:bg-[#2a2825]"
          >
            My Shelf
          </button>
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-[#6b7280] dark:text-[#9ca3af] hover:text-[#1a1a2e] dark:hover:text-[#f0ece4] hover:bg-[#f0ece4] dark:hover:bg-[#2a2825] transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => router.push("/preferences")}
            className="p-2 rounded-lg text-[#6b7280] dark:text-[#9ca3af] hover:text-[#1a1a2e] dark:hover:text-[#f0ece4] hover:bg-[#f0ece4] dark:hover:bg-[#2a2825] transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
          <UserButton />
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-[#e8e4dc] dark:border-[#2a2825] border-t-[#1a1a2e] dark:border-t-[#f0ece4] animate-spin" />
            <p className="text-[#9ca3af] text-sm">{loadingMsg}</p>
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-[#9ca3af]">No books found.</p>
            <button
              onClick={() => loadBooks(true)}
              className="text-sm text-[#1a1a2e] dark:text-[#f0ece4] hover:opacity-60 transition-opacity font-medium"
            >
              Try again →
            </button>
          </div>
        ) : (
          <SwipeStack
            books={books}
            onEmpty={() => loadBooks(true)}
            onStackChange={(stack) => { cachedStack = stack; }}
          />
        )}
      </main>
    </div>
  );
}