import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { fetchBulkBooks, GENRE_TAG_MAP, Book } from "@/lib/books";

const FALLBACK_GENRES = ["Fantasy", "Science Fiction", "Mystery", "Thriller", "Historical Fiction"];

const RELATED_GENRES: Record<string, string[]> = {
  "Science Fiction": ["Fantasy", "Adventure", "Thriller"],
  "Fantasy": ["Science Fiction", "Adventure", "Historical Fiction"],
  "Mystery": ["Thriller", "Crime", "Psychology"],
  "Thriller": ["Mystery", "Crime", "Horror"],
  "Romance": ["Historical Fiction", "Classic"],
  "Horror": ["Thriller", "Mystery", "Fantasy"],
  "Historical Fiction": ["Classic", "Biography", "Adventure"],
  "Biography": ["Psychology", "Philosophy"],
  "Self Help": ["Psychology", "Philosophy"],
  "Philosophy": ["Psychology", "Classic"],
  "Psychology": ["Philosophy", "Self Help"],
  "Classic": ["Historical Fiction", "Fiction"],
  "Adventure": ["Science Fiction", "Fantasy", "Thriller"],
  "Crime": ["Mystery", "Thriller"],
  "Fiction": ["Classic", "Historical Fiction"],
};

// Tags that are too generic to use as genre signals
const GENERIC = new Set([
  "Fiction", "Nonfiction", "Juvenile Fiction", "Juvenile Nonfiction", "General",
  "Young Adult", "Middle Grade", "Literature",
]);

function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v);
}

// Normalize a raw tag string to a known genre key if possible
function resolveGenre(tag: string): string | null {
  const cleaned = tag.split("/")[0].trim();
  if (GENERIC.has(cleaned)) return null;
  // Direct match
  if (cleaned in GENRE_TAG_MAP) return cleaned;
  // Reverse match — check if this tag is in any genre's tag list
  for (const [genre, tags] of Object.entries(GENRE_TAG_MAP)) {
    if (tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) return genre;
  }
  return null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ books: [] });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      genres: true,
      shelf: { select: { genres: true, googleBooksId: true } },
      swipes: { select: { googleBooksId: true, direction: true } },
    },
  });

  if (!user) return NextResponse.json({ books: [] });

  const userGenreNames = new Set(user.genres.map((g) => g.genre));

  // --- Build genre weights ---
  const weights: Record<string, number> = {};

  // Base weight from explicit user genre selection
  for (const g of user.genres) {
    weights[g.genre] = (weights[g.genre] ?? 0) + 10;
  }

  // Boost from RIGHT swipes (liked books) — expand beyond user's explicit genres
  const rightSwipedIds = new Set(
    user.swipes.filter((s) => s.direction === "RIGHT").map((s) => s.googleBooksId)
  );
  for (const book of user.shelf) {
    const isLiked = rightSwipedIds.has(book.googleBooksId);
    const boost = isLiked ? 3 : 1; // liked books boost more than just shelved
    for (const tag of book.genres) {
      const genre = resolveGenre(tag);
      if (!genre) continue;
      weights[genre] = (weights[genre] ?? 0) + boost;
    }
  }

  // Penalize genres from LEFT swipes (disliked books)
  // Only penalize genres not in user's explicit selection
  const leftSwipes = user.swipes.filter((s) => s.direction === "LEFT");
  // We don't have genre data on swipes directly, so we'll rely on shelf signal above
  // Future: store genres on Swipe model too for stronger signal

  // Expand into related genres — weighted proportionally, not binary
  for (const [genre, weight] of Object.entries(weights)) {
    if (GENERIC.has(genre)) continue;
    for (const related of RELATED_GENRES[genre] ?? []) {
      if (!weights[related]) {
        // Only add related genres if they're explicitly selected OR
        // the source genre has strong enough signal
        if (userGenreNames.has(related) || weight >= 10) {
          weights[related] = Math.max(1, Math.floor(weight * 0.15));
        }
      }
    }
  }

  // Remove genres with negligible weight
  for (const genre of Object.keys(weights)) {
    if (weights[genre] < 1) delete weights[genre];
  }

  // Cap to top 6 genres by weight
  const topGenreWeights: Record<string, number> = Object.fromEntries(
    Object.entries(weights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  );

  // Fallback if no genres resolved
  if (Object.keys(topGenreWeights).length === 0) {
    const fallbackWeights = Object.fromEntries(FALLBACK_GENRES.map((g) => [g, 10]));
    const fallback = await fetchBulkBooks(fallbackWeights, 60, 0);
    return NextResponse.json({ books: shuffle(fallback), genres: FALLBACK_GENRES });
  }

  const swipedIds = new Set([
    ...user.swipes.map((s) => s.googleBooksId),
    ...user.shelf.map((s) => s.googleBooksId),
  ]);

  // Randomize offset for variety — but keep it small enough to stay within results
  // Use a low max offset so we don't accidentally skip past all results
  const offset = Math.floor(Math.random() * 3) * 20; // 0, 20, or 40

  console.log("userGenres:", [...userGenreNames]);
  console.log("topGenreWeights:", topGenreWeights);

  const books = await fetchBulkBooks(topGenreWeights, 60, offset);

  const seen = new Set<string>();
  const filtered: Book[] = books.filter((b) => {
    if (seen.has(b.id) || swipedIds.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });

  // If we got nothing (e.g. user has swiped everything), try offset 0 with user genres
  if (filtered.length === 0) {
    const retry = await fetchBulkBooks(topGenreWeights, 60, 0);
    const retryFiltered = retry.filter((b) => !swipedIds.has(b.id));
    if (retryFiltered.length > 0) {
      return NextResponse.json({
        books: shuffle(retryFiltered),
        genres: Object.keys(topGenreWeights),
      });
    }
    // True fallback — user has exhausted their genres
    const fallbackWeights = Object.fromEntries(FALLBACK_GENRES.map((g) => [g, 10]));
    const fallback = await fetchBulkBooks(fallbackWeights, 60, 0);
    return NextResponse.json({ books: shuffle(fallback), genres: FALLBACK_GENRES });
  }

  return NextResponse.json({
    books: shuffle(filtered),
    genres: Object.keys(topGenreWeights),
  });
}