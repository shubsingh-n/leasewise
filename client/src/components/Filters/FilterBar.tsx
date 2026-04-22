import React, { useState } from 'react';
import { SlidersHorizontal, Map as MapIcon, Layers } from 'lucide-react';
import FilterModal from './FilterModal';

interface FilterBarProps {
  onFilterChange: (filters: any) => void;
  onStyleChange: (style: string) => void;
  mapStyle: string;
  currentFilters: any;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, onStyleChange, mapStyle, currentFilters }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeFiltersCount = Object.keys(currentFilters).filter(k => currentFilters[k] !== undefined && currentFilters[k] !== '').length;

  return (
    <div className="relative z-20 w-fit mx-auto max-w-full">
      {/* Single-row pill — no wrapping */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50">

        {/* Filters button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 md:px-5 py-2 text-xs font-black text-slate-800 hover:bg-slate-100 rounded-xl transition-all active:scale-95 whitespace-nowrap"
        >
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shrink-0">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-200 shrink-0" />

        {/* Map style toggle */}
        <div className="flex items-center bg-slate-100/60 p-0.5 rounded-xl gap-0.5 shrink-0">
          <button
            onClick={() => onStyleChange('streets-v11')}
            className={`flex items-center justify-center px-2.5 py-2 rounded-lg transition-all ${
              mapStyle === 'streets-v11' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Map"
          >
            <MapIcon className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline ml-1.5 text-xs font-bold whitespace-nowrap">Map</span>
          </button>
          <button
            onClick={() => onStyleChange('satellite-v9')}
            className={`flex items-center justify-center px-2.5 py-2 rounded-lg transition-all ${
              mapStyle === 'satellite-v9' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Satellite"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline ml-1.5 text-xs font-bold whitespace-nowrap">Satellite</span>
          </button>
        </div>
      </div>

      <FilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={onFilterChange}
        currentFilters={currentFilters}
      />
    </div>
  );
};

export default FilterBar;
