import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Dog, Calendar, Shield } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState(currentFilters);

  const bhkOptions = [
    { label: '1RK', value: 0.5 },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4+', value: 4 }
  ];
  const furnishingOptions = ['unfurnished', 'semi-furnished', 'fully-furnished'];

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white rounded-[2.5rem] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Perfect Home Filters</h2>
              <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto font-sans flex-1 custom-scrollbar">
              
              {/* Availability Filter */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block">Move-in Date</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input 
                    type="date"
                    value={filters.availableFrom || ''}
                    onChange={(e) => setFilters({...filters, availableFrom: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl pl-12 pr-6 py-5 outline-none focus:border-indigo-500 transition-all font-black text-slate-800 appearance-none group-hover:bg-slate-100"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block">Monthly Budget</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input 
                      type="number" 
                      value={filters.minPrice || ''}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      placeholder="Min ₹"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-5 outline-none focus:border-indigo-500 transition-all font-black text-slate-800 placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="number" 
                      value={filters.maxPrice || ''}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      placeholder="Max ₹"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-5 outline-none focus:border-indigo-500 transition-all font-black text-slate-800 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* BHK Type */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block">Room Configuration</label>
                <div className="grid grid-cols-5 gap-3">
                  {bhkOptions.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setFilters({...filters, bhk: filters.bhk === opt.value ? undefined : opt.value})}
                      className={`py-5 rounded-2xl border-2 font-black transition-all text-xs tracking-tighter ${
                        filters.bhk === opt.value 
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pet Friendly Toggle */}
              <div>
                <button
                  onClick={() => setFilters({...filters, petFriendly: !filters.petFriendly})}
                  className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all group ${
                    filters.petFriendly ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-3xl transition-all ${filters.petFriendly ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                      <Dog className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-black uppercase tracking-tight ${filters.petFriendly ? 'text-indigo-800' : 'text-slate-800'}`}>Pet Friendly</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Allow household pets</div>
                    </div>
                  </div>
                  <div className={`w-14 h-8 rounded-full relative transition-all ${filters.petFriendly ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${filters.petFriendly ? 'left-7.5' : 'left-1.5'}`} />
                  </div>
                </button>
              </div>

              {/* Female Only Toggle */}
              <div>
                <button
                  onClick={() => setFilters({...filters, femaleOnly: !filters.femaleOnly})}
                  className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all group ${
                    filters.femaleOnly ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-3xl transition-all ${filters.femaleOnly ? 'bg-pink-500 text-white scale-110 shadow-lg border border-pink-400' : 'bg-slate-200 text-slate-500'}`}>
                      <Shield className="w-6 h-6 fill-current" />
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-black uppercase tracking-tight ${filters.femaleOnly ? 'text-pink-700' : 'text-slate-800'}`}>Female Only</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Properties exclusive to women</div>
                    </div>
                  </div>
                  <div className={`w-14 h-8 rounded-full relative transition-all ${filters.femaleOnly ? 'bg-pink-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${filters.femaleOnly ? 'left-[1.8rem]' : 'left-1.5'}`} />
                  </div>
                </button>
              </div>

              {/* Furnishing */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block">Furnishing Status</label>
                <div className="space-y-4">
                  {furnishingOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => setFilters({...filters, furnishing: filters.furnishing === option ? undefined : option})}
                      className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                        filters.furnishing === option ? 'border-indigo-600 bg-white' : 'border-slate-50 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`capitalize font-black text-xs uppercase tracking-widest ${filters.furnishing === option ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {option.replace('-', ' ')}
                      </span>
                      {filters.furnishing === option && (
                        <div className="bg-indigo-600 rounded-full p-1.5 shadow-xl shadow-indigo-100">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t bg-slate-50 flex gap-6">
              <button 
                onClick={() => setFilters({})}
                className="px-6 py-5 font-black text-[12px] text-slate-400 hover:text-slate-800 uppercase tracking-[0.3em] transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={handleApply}
                className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[1.8rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-[0.2em] text-xs"
              >
                Find My Home
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
