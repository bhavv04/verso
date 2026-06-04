"use client";

import { BookOpen, Sun, Moon, Settings, ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "@/lib/theme";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const isHome = pathname === "/";

  return (
    <nav className="flex items-center sticky justify-between p-4 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        {!isHome && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Go to homepage"
        >
          <div className="w-9 h-9 rounded-full bg-stone-900 dark:bg-stone-100 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white dark:text-stone-900" />
          </div>
          <span className="text-lg text-black dark:text-stone-100">verso</span>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => router.push("/shelf")}
          className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          My Shelf
        </button>
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => router.push("/preferences")}
          className="py-2 px-4 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
        <UserButton />
      </div>
    </nav>
  );
}