"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Moon, Sun } from "lucide-react";
import GenrePicker from "@/components/GenrePicker";
import { useTheme } from "@/lib/theme";

export default function PreferencesPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        const userGenres = data.user?.genres?.map((g: any) => g.genre) ?? [];
        setGenres(userGenres);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genres }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0f0e0c] text-[#1a1a2e] dark:text-[#f0ece4]">
      <nav className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-[#1a1916] border-b border-[#e8e4dc] dark:border-[#2a2825] sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => router.push("/")}
          className="p-2 rounded-lg text-[#6b7280] dark:text-[#9ca3af] hover:text-[#1a1a2e] dark:hover:text-[#f0ece4] hover:bg-[#f0ece4] dark:hover:bg-[#2a2825] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] dark:bg-[#f0ece4] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white dark:text-[#1a1a2e]" />
          </div>
          <span className="font-bold text-lg tracking-tight">preferences</span>
        </div>
        <button
          onClick={toggle}
          className="ml-auto p-2 rounded-lg text-[#6b7280] dark:text-[#9ca3af] hover:text-[#1a1a2e] dark:hover:text-[#f0ece4] hover:bg-[#f0ece4] dark:hover:bg-[#2a2825] transition-all"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </nav>

      <main className="px-8 py-10 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Your genres</h1>
        <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm mb-8">
          Pick up to 5 genres. Your feed weights these alongside books you've liked.
        </p>

        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 rounded-full border-4 border-[#e8e4dc] dark:border-[#2a2825] border-t-[#1a1a2e] dark:border-t-[#f0ece4] animate-spin" />
          </div>
        ) : (
          <>
            <GenrePicker selected={genres} onChange={setGenres} />
            <button
              onClick={handleSave}
              disabled={saving || genres.length === 0}
              className="mt-10 w-full py-3.5 rounded-xl font-semibold bg-[#1a1a2e] dark:bg-[#f0ece4] text-white dark:text-[#1a1a2e] hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save preferences"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}