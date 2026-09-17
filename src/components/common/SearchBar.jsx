import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onFilterClick,
  showFilter = false,
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          aria-label={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-base"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="p-1 hover:bg-accent rounded-full"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
        {showFilter && (
          <button
            type="button"
            onClick={onFilterClick}
            className="p-1.5 hover:bg-accent rounded-xl"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
