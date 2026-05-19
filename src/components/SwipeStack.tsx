"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BookCard from "./BookCard";
import { Book } from "@/lib/books";
import { X, Heart } from "lucide-react";

interface SwipeStackProps {
  books: Book[];
  onEmpty: () => void;
}

export default function SwipeStack({ books, onEmpty }: SwipeStackProps) {
  const [stack, setStack] = useState<Book[]>(books);
  const [lastDirection, setLastDirection] = useState<"LEFT" | "RIGHT" | null>(null);

  const handleSwipe = async (direction: "LEFT" | "RIGHT") => {
    const book = stack[stack.length - 1];
    if (!book) return;

    setLastDirection(direction);
    setStack((prev) => prev.slice(0, -1));

    if (stack.length === 1) onEmpty();

    await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleBooksId: book.id, direction, book }),
    });
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Card stack */}
      <div className="relative w-80 h-[500px]">
        <AnimatePresence>
          {stack.slice(-2).map((book, i) => {
            const isTop = i === stack.slice(-2).length - 1;
            return (
              <motion.div
                key={book.id}
                className="absolute inset-0"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  x: lastDirection === "RIGHT" ? 300 : -300,
                  opacity: 0,
                  transition: { duration: 0.3 },
                }}
              >
                <BookCard book={book} onSwipe={handleSwipe} isTop={isTop} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="flex gap-6">
        <button
          onClick={() => handleSwipe("LEFT")}
          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => handleSwipe("RIGHT")}
          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-green-500/20 hover:border-green-500/50 transition-all"
        >
          <Heart className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}