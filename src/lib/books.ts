const HARDCOVER_API_URL = "https://api.hardcover.app/v1/graphql";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  rating: number | null;
  genres: string[];
  pageCount: number | null;
  publishedDate: string | null;
  subjects?: string[];
  editions?: number | null;
  openLibraryKey?: string | null;
}

async function hardcoverQuery(query: string, variables: Record<string, any> = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(HARDCOVER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.HARDCOVER_API_KEY}`,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Hardcover API error: ${res.status}`);
      return res.json();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export const GENRE_TAG_MAP: Record<string, string[]> = {
  "Fantasy": ["Fantasy", "Epic Fantasy", "High Fantasy", "Urban Fantasy"],
  "Science Fiction": ["Science Fiction", "Sci-Fi", "Space Opera", "Cyberpunk"],
  "Mystery": ["Mystery", "Mystery Fiction", "Cozy Mystery"],
  "Thriller": ["Thriller", "Psychological Thriller", "Suspense"],
  "Romance": ["Romance", "Contemporary Romance", "Historical Romance"],
  "Horror": ["Horror", "Dark Fantasy"],
  "Historical Fiction": ["Historical Fiction", "Historical"],
  "Biography": ["Biography", "Memoir", "Autobiography"],
  "Self Help": ["Self-Help", "Self Help", "Personal Development"],
  "Philosophy": ["Philosophy"],
  "Psychology": ["Psychology"],
  "Classic": ["Classics", "Classic Literature"],
  "Adventure": ["Adventure", "Action & Adventure"],
  "Crime": ["Crime", "Crime Fiction", "Detective"],
  "Fiction": ["Literary Fiction", "Contemporary Fiction"],
};

const NOISE_TAGS = new Set([
  "funny", "fast", "slow", "medium", "dark", "hopeful", "emotional",
  "inspiring", "lighthearted", "mysterious", "relaxing", "tense",
  "Plot driven", "Character driven", "A mix driven",
  "Strong Character Development", "Weak Character Development",
  "Loveable Characters", "Unloveable Characters",
  "Diverse Characters", "Not Diverse Characters",
  "challenging", "reflective", "sad", "informative", "Maybe",
  "Adventurous", "Jazz", "War",
]);

function mapBook(book: any): Book {
  const uniqueTags = [...new Set(
    (book.taggings ?? [])
      .map((t: any) => t.tag?.tag)
      .filter((t: any): t is string =>
        typeof t === "string" &&
        t.length > 0 &&
        t.length < 30 &&
        !NOISE_TAGS.has(t) &&
        !t.includes("/")
      )
  )] as string[];

  return {
    id: String(book.id),
    title: book.title ?? "Unknown Title",
    author: book.contributions?.[0]?.author?.name ?? "Unknown Author",
    coverUrl: book.image?.url ?? "",
    description: book.description ?? "",
    rating: book.rating ?? null,
    genres: uniqueTags.slice(0, 5),
    pageCount: book.pages ?? null,
    publishedDate: book.release_year ? String(book.release_year) : null,
    subjects: uniqueTags.slice(5, 12),
    editions: null,
    openLibraryKey: null,
  };
}

function isUsableBook(book: Book): boolean {
  return (
    book.coverUrl !== "" &&
    book.description.length > 100 &&
    book.title !== "Unknown Title" &&
    book.author !== "Unknown Author"
  );
}

/**
 * Fetch books for a single genre with offset support.
 * Used when you want per-genre control (e.g. weighted fetching).
 */
export async function fetchBooksByGenre(
  genre: string,
  limit = 10,
  offset = 0
): Promise<Book[]> {
  const tags = GENRE_TAG_MAP[genre] ?? [genre];

  const query = `
    query BooksByGenre($tags: [String!]!, $limit: Int!, $offset: Int!) {
      books(
        where: {
          taggings: { tag: { tag: { _in: $tags } } }
          image: { url: { _is_null: false } }
          pages: { _gte: 100 }
          rating: { _gte: 3.5 }
        }
        order_by: { ratings_count: desc }
        limit: $limit
        offset: $offset
      ) {
        id
        title
        description
        release_year
        pages
        rating
        ratings_count
        image { url }
        contributions { author { name } }
        taggings { tag { tag } }
      }
    }
  `;

  try {
    const data = await hardcoverQuery(query, { tags, limit: limit * 2, offset });
    if (data.errors) {
      console.error(`Hardcover errors for genre "${genre}":`, data.errors);
      return [];
    }
    return (data?.data?.books ?? [])
      .map(mapBook)
      .filter(isUsableBook)
      .slice(0, limit);
  } catch (err) {
    console.error(`Hardcover fetch error for genre "${genre}":`, err);
    return [];
  }
}

/**
 * Fetch books across multiple genres in parallel, with per-genre quotas
 * based on weights. Higher-weighted genres get more slots.
 *
 * @param genreWeights  Record of genre -> weight (higher = more books fetched)
 * @param totalLimit    Total books to return across all genres
 * @param offset        Pagination offset (randomized by caller for variety)
 */
export async function fetchBulkBooks(
  genreWeights: Record<string, number>,
  totalLimit = 60,
  offset = 0
): Promise<Book[]> {
  const genres = Object.keys(genreWeights);
  if (genres.length === 0) return [];

  const totalWeight = Object.values(genreWeights).reduce((a, b) => a + b, 0);

  // Assign per-genre limits proportional to weight, minimum 5 each
  const perGenreLimits: Record<string, number> = {};
  for (const genre of genres) {
    const share = genreWeights[genre] / totalWeight;
    perGenreLimits[genre] = Math.max(5, Math.round(share * totalLimit));
  }

  // Fetch all genres in parallel
  const results = await Promise.all(
    genres.map((genre) => fetchBooksByGenre(genre, perGenreLimits[genre], offset))
  );

  // Merge, deduplicate by id
  const seen = new Set<string>();
  const merged: Book[] = [];
  for (const books of results) {
    for (const book of books) {
      if (!seen.has(book.id)) {
        seen.add(book.id);
        merged.push(book);
      }
    }
  }

  return merged;
}