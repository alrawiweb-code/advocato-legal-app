"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  initialValue = "",
  onSearch,
  placeholder = "Search by name, legal issue, or specialization...",
  className = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external initialValue changes (e.g., from URL)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Debounce the actual search callback
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      onSearch(newValue);
    }, 400); // 400ms debounce
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  return (
    <div className={`relative flex w-full max-w-2xl mx-auto ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Search className="w-5 h-5 text-outline" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="w-full pl-11 pr-12 py-4 bg-surface rounded-full border border-hairline shadow-sm text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition-all font-body-md"
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-outline hover:text-primary transition-colors"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
