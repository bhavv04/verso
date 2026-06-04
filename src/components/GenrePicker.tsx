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
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100"
                : "bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:text-stone-900 dark:hover:text-stone-100"
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
}