"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import SwipeStack from "@/components/SwipeStack";
import { Book } from "@/lib/books";
import { BookOpen } from "lucide-react";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState("fiction");

  useEffect(() => {
    if (isLoaded && !user) router.push("/sign-in");
  }, [isLoaded, user]);

  useEffect(() => {
    if (user) {
      fetch("/api/user", { method: "POST" }).then(() => fetchBooks());
    }
  }, [user, genre]);


  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books?genre=${genre}`);
      const data = await res.json();
      setBooks(data.books ?? []);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span className="font-semibold tracking-tight">verso</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/shelf")}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            My Shelf
          </button>
          <UserButton />
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {loading ? (
          <p className="text-white/40">Loading books...</p>
        ) : books.length === 0 ? (
          <p className="text-white/40">No books found.</p>
        ) : (
          <SwipeStack books={books} onEmpty={fetchBooks} />
        )}
      </main>
    </div>
  );
}