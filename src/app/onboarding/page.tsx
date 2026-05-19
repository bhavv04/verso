"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import GenrePicker from "@/components/GenrePicker";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (genres.length === 0) return;
    setLoading(true);

    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genres }),
    });

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full">
        <h1 className="text-4xl font-bold mb-2">Hey {user?.firstName ?? "there"} 👋</h1>
        <p className="text-white/60 mb-8">
          Pick up to 5 genres you enjoy. We'll use these to seed your stack.
        </p>

        <GenrePicker selected={genres} onChange={setGenres} />

        <button
          onClick={handleContinue}
          disabled={genres.length === 0 || loading}
          className="mt-10 w-full py-3 rounded-xl font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Setting up..." : "Start swiping →"}
        </button>
      </div>
    </div>
  );
}