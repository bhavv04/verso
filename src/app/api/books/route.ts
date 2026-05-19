import { NextRequest, NextResponse } from "next/server";
import { fetchBooksByGenre } from "@/lib/books";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get("genre") ?? "fiction";

  try {
    const books = await fetchBooksByGenre(genre);
    return NextResponse.json({ books });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}