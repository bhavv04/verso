"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, RotateCcw } from "lucide-react";
import BookCard from "@/components/BookCard";
import { Book } from "@/lib/books";

const DEMO_BOOKS: Book[] = [
  {
    id: "demo-1",
    title: "Piranesi",
    author: "Susanna Clarke",
    coverUrl: "https://assets.hardcover.app/editions/30480426/ec301cb7-b118-48fd-aa3a-5d336e61c182.jpg",
    description: "Piranesi lives in the House. He explores the infinite labyrinth of halls and statues, recording the tides that sweep through them.",
    rating: 4.3,
    genres: ["Fantasy", "Mystery", "Literary Fiction"],
    pageCount: 245,
    publishedDate: "2020",
    subjects: ["Labyrinths", "Solitude", "Magical Realism"],
  },
  {
    id: "demo-2",
    title: "The Way of Kings",
    author: "Brandon Sanderson",
    coverUrl: "https://assets.hardcover.app/edition/3134360/a18d937805a28e3214a556442c8d33f41c02f2cb.jpeg",
    description: "In a world of stone and storms, four characters must find their way through war, slavery, and ancient magic.",
    rating: 4.6,
    genres: ["Epic Fantasy", "Adventure"],
    pageCount: 1007,
    publishedDate: "2010",
    subjects: ["Knights Radiant", "Shattered Plains", "Highstorms"],
  },
  {
    id: "demo-3",
    title: "The Brothers Karamazov",
    author: "Fyodor Dostoevsky",
    coverUrl: "https://assets.hardcover.app/edition/31370986/f057a871e6635e92341a5d3c47840dd16a91c543.jpeg",
    description: "A passionate philosophical novel that enters deeply into the questions of God, free will, and morality.",
    rating: 4.4,
    genres: ["Classics", "Philosophy", "Psychological Fiction"],
    pageCount: 796,
    publishedDate: "1880",
    subjects: ["Patricide", "Faith", "19th Century Russia"],
  },
  {
    id: "demo-4",
    title: "War and Peace",
    author: "Leo Tolstoy",
    coverUrl: "https://assets.hardcover.app/edition/9684379/e9bc37af227c7f3f9465c3adcaeceedc34fba818.jpeg",
    description: "A broad panoramic view of Russian society during the Napoleonic Era, following the lives of five aristocratic families.",
    rating: 4.2,
    genres: ["Classics", "Historical Fiction", "Russian Literature"],
    pageCount: 1225,
    publishedDate: "1869",
    subjects: ["Napoleon", "History", "Aristocracy"],
  },
  {
    id: "demo-5",
    title: "The Last Wish",
    author: "Andrzej Sapkowski",
    coverUrl: "https://assets.hardcover.app/external_data/45227371/e884c4a2b40fab63bff10f9e2213c3854952f4e8.jpeg",
    description: "Geralt of Rivia is a Witcher, a man whose magic powers, enhanced by long training and a mysterious elixir, have made him a brilliant fighter.",
    rating: 4.2,
    genres: ["Fantasy", "Action", "Short Stories"],
    pageCount: 384,
    publishedDate: "1993",
    subjects: ["Monster Hunting", "Folklore", "Geralt of Rivia"],
  },
  {
    id: "demo-6",
    title: "Count of Monte Cristo",
    author: "Alexandre Dumas",
    coverUrl: "https://assets.hardcover.app/edition/22062767/3432f1033b04d23e47edea3a864bb956f3b6346e.jpeg",
    description: "A tale of revenge and redemption set in 19th-century France.",
    rating: 4.5,
    genres: ["Classics", "Adventure", "Drama"],
    pageCount: 1276,
    publishedDate: "1844",
    subjects: ["Revenge", "Justice", "Betrayal"],
  },
];

export default function Demo() {
  const [stack, setStack] = useState<Book[]>(DEMO_BOOKS.slice().reverse());
  const [swipeCount, setSwipeCount] = useState(0);
  const exitDirectionRef = useRef<"LEFT" | "RIGHT">("LEFT");

  const handleSwipe = (direction: "LEFT" | "RIGHT") => {
    if (stack.length === 0) return;
    exitDirectionRef.current = direction;
    setStack((prev) => prev.slice(0, -1));
    setSwipeCount((c) => c + 1);
  };

  const handleReset = () => {
    setStack(DEMO_BOOKS.slice().reverse());
    setSwipeCount(0);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card stack */}
      <div className="relative w-[80vw] h-[120vw] sm:w-[280px] sm:h-[420px] max-w-sm">
        <AnimatePresence custom={exitDirectionRef.current}>
          {stack.length > 0 ? (
            stack.slice(-1).map((book) => (
              <motion.div
                key={book.id}
                custom={exitDirectionRef.current}
                className="absolute inset-0"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                variants={{
                  exit: (direction: "LEFT" | "RIGHT") => ({
                    x: direction === "RIGHT" ? 400 : -400,
                    rotate: direction === "RIGHT" ? 25 : -25,
                    opacity: 0,
                    transition: { duration: 0.3 },
                  }),
                }}
                exit="exit"
              >
                <BookCard book={book} onSwipe={handleSwipe} isTop={true} />
              </motion.div>
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-stone-200 dark:border-stone-700/40 bg-stone-100 dark:bg-stone-800/60"
            >
              <p className="text-gray-500 dark:text-stone-400 text-sm text-center px-6">
                That's the demo — sign up to swipe through 1M+ real books.
              </p>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-900 dark:text-stone-100 hover:opacity-60 transition-opacity"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Replay demo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Swipe buttons */}
      <div className="flex gap-4 w-[85vw] sm:w-full max-w-sm">
        <button
          onClick={() => handleSwipe("LEFT")}
          disabled={stack.length === 0}
          aria-label="Pass"
          className="flex-1 flex items-center justify-center p-4 rounded-full bg-stone-100 dark:bg-stone-800/60 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 active:scale-95 transition-all group disabled:opacity-40 disabled:pointer-events-none touch-manipulation"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-stone-400 group-hover:text-red-500 transition-colors" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => handleSwipe("RIGHT")}
          disabled={stack.length === 0}
          aria-label="Save"
          className="flex-1 flex items-center justify-center p-4 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 shadow-sm transition-all disabled:opacity-40 disabled:pointer-events-none touch-manipulation"
        >
          <Heart className="w-5 h-5 text-white fill-white" strokeWidth={2} />
        </button>
      </div>

      {/* Counter */}
      <p className="text-gray-400 dark:text-stone-500 text-xs">
        {swipeCount} swipes
      </p>
    </div>
  );
}