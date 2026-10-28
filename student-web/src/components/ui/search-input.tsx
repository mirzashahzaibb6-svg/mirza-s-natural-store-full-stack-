'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Debounced search box: onSearch fires 350ms after the user stops typing. */
export function SearchInput({ placeholder = 'Search…', onSearch }: { placeholder?: string; onSearch: (value: string) => void }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    const id = setTimeout(() => onSearch(value.trim()), 350);
    return () => clearTimeout(id);
  }, [value, onSearch]);

  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-full border border-line bg-transparent py-2.5 pl-10 pr-4 text-pearl placeholder:text-mute/60 focus:border-brass focus:outline-none"
      />
    </div>
  );
}
