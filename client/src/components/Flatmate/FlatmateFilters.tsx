import React from 'react';
import { Calendar, IndianRupee, MapPin } from 'lucide-react';

interface FlatmateFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
}

const FlatmateFilters: React.FC<FlatmateFiltersProps> = ({ filters, setFilters }) => {
  const genders = ['Any', 'Male', 'Female'];
  const bhkOptions = [
    { label: '1RK', value: 0.5 },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4+', value: 4 },
    { label: 'PG', value: 'PG' },
    { label: 'Hostel', value: 'Hostel' }
  ] as const;

  const handleChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const setBhkPreference = (value: (typeof bhkOptions)[number]['value']) => {
    // Numeric BHK preference filters by bhkPreference; PG/Hostel filter via propertyType (server expects propertyType string)
    if (value === 'PG' || value === 'Hostel') {
      setFilters({ ...filters, propertyType: value, bhkPreference: '' });
    } else {
      setFilters({ ...filters, bhkPreference: value, propertyType: '' });
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white z-10 p-6 overflow-y-auto custom-scrollbar">
      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6">Filter Requirements</h2>

      <div className="space-y-8">
        {/* Budget */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block">Rent Budget</label>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="number"
                placeholder="Min rent"
                value={filters.minBudget || ''}
                onChange={e => handleChange('minBudget', e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-9 pr-3 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
              />
            </div>
            <div className="flex-1 relative">
              <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="number"
                placeholder="Max rent"
                value={filters.maxBudget || ''}
                onChange={e => handleChange('maxBudget', e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-9 pr-3 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Location Search */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Location</label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="e.g. Cyber City"
              value={filters.location || ''}
              onChange={e => handleChange('location', e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Move In Date */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Move-in Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date"
              value={filters.moveInDate || ''}
              onChange={e => handleChange('moveInDate', e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Gender Preference</label>
          <div className="flex bg-slate-50 border-2 border-slate-100 rounded-2xl overflow-hidden p-1">
            {genders.map(g => (
              <button
                key={g}
                onClick={() => handleChange('genderPreference', g)}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filters.genderPreference === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* BHK Preference */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">BHK Preference</label>
          <div className="flex flex-wrap gap-2">
            {bhkOptions.map(opt => {
              const selected =
                opt.value === 'PG' || opt.value === 'Hostel'
                  ? filters.propertyType === opt.value
                  : Number(filters.bhkPreference) === opt.value;

              return (
                <button
                  key={opt.label}
                  onClick={() => {
                    if (selected) setFilters({ ...filters, bhkPreference: '', propertyType: '' });
                    else setBhkPreference(opt.value);
                  }}
                  className={`px-3 py-2 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                    selected ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-10 pt-6 border-t border-slate-100">
        <button 
          onClick={() => setFilters({ genderPreference: 'Any', propertyType: '', bhkPreference: '' })}
          className="w-full bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg hover:bg-slate-700 transition-colors uppercase tracking-[0.2em] text-xs"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FlatmateFilters;
