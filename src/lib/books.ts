const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";

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
}

export async function fetchBooksByGenre(genre: string, maxResults = 20): Promise<Book[]> {
  const res = await fetch(
    `${GOOGLE_BOOKS_URL}?q=subject:${encodeURIComponent(genre)}&maxResults=${maxResults}&orderBy=relevance&key=${process.env.GOOGLE_BOOKS_API_KEY}`
  );

  if (!res.ok) throw new Error("Failed to fetch books");

  const data = await res.json();

  return (data.items ?? [])
    .map((item: any) => {
      const info = item.volumeInfo;
      return {
        id: item.id,
        title: info.title ?? "Unknown Title",
        author: info.authors?.[0] ?? "Unknown Author",
        coverUrl: info.imageLinks?.thumbnail?.replace("http://", "https://") ?? "",
        description: info.description ?? "No description available.",
        rating: info.averageRating ?? null,
        genres: info.categories ?? [],
        pageCount: info.pageCount ?? null,
        publishedDate: info.publishedDate ?? null,
      };
    })
    .filter((book: Book) => book.coverUrl !== "");
}