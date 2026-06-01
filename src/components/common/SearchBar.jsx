import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search...",
  onFilterClick,
  showFilter = false
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </motion.button>
          )}
        </AnimatePresence>
        {showFilter && (
          <button
            onClick={onFilterClick}
            className="p-1.5 hover:bg-gray-200 rounded-xl"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}