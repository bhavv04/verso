"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Star } from "lucide-react";

interface ShelfBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number | null;
  genres: string[];
}

export default function ShelfPage() {
  const router = useRouter();
  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shelf")
      .then((r) => r.json())
      .then((d) => setBooks(d.books ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <button onClick={() => router.push("/")} className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span className="font-semibold tracking-tight">my shelf</span>
        </div>
      </nav>

      <main className="px-6 py-8 max-w-4xl mx-auto">
        {loading ? (
          <p className="text-white/40">Loading shelf...</p>
        ) : books.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-white/40 text-lg">Your shelf is empty.</p>
            <p className="text-white/30 text-sm mt-2">Swipe right on books you like to save them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {books.map((book) => (
              <div key={book.id} className="flex flex-col gap-2">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-neutral-600" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{book.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{book.author}</p>
                  {book.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-white/60">{book.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}