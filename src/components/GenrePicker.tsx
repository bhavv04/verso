"use client";

const GENRES = [
  "Fiction", "Fantasy", "Science Fiction", "Mystery", "Thriller",
  "Romance", "Horror", "Historical Fiction", "Biography", "Self Help",
  "Philosophy", "Psychology", "Classic", "Adventure", "Crime",
];

interface GenrePickerProps {
  selected: string[];
  onChange: (genres: string[]) => void;
}

export default function GenrePicker({ selected, onChange }: GenrePickerProps) {
  const toggle = (genre: string) => {
    if (selected.includes(genre)) {
      onChange(selected.filter((g) => g !== genre));
    } else if (selected.length < 5) {
      onChange([...selected, genre]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {GENRES.map((genre) => {
        const active = selected.includes(genre);
        return (
          <button
            key={genre}
            onClick={() => toggle(genre)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              active
                ? "bg-white text-black border-white"
                : "bg-transparent text-white/70 border-white/20 hover:border-white/50"
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
}