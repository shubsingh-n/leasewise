import React, { useEffect, useState, useRef, useCallback } from 'react';
import { User, MapPin, Calendar, Heart, Bed } from 'lucide-react';
import { getApiBaseUrl } from '../../services/api';

interface FlatmateListProps {
  filters: any;
  onSelect: (req: any) => void;
  selectedId: string | null;
  refreshKey?: number;
  savedIds: string[];
  onToggleSave: (e: React.MouseEvent, id: string) => void;
}

const FlatmateList: React.FC<FlatmateListProps> = ({
  filters,
  onSelect,
  selectedId,
  refreshKey = 0,
  savedIds,
  onToggleSave
}) => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchRequirements = async (pageNum: number, isNewSearch: boolean = false) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        page: pageNum.toString(),
        limit: '10'
      });
      Array.from(queryParams.keys()).forEach(key => {
        if (!queryParams.get(key) || queryParams.get(key) === 'Any') {
          queryParams.delete(key);
        }
      });

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/flatmates?${queryParams}`);
      const data = await res.json();
      const items = Array.isArray(data.data) ? data.data : [];

      if (isNewSearch) {
        setRequirements(items);
      } else {
        setRequirements(prev => [...prev, ...items]);
      }
      setHasMore(pageNum < (data.totalPages || 1));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchRequirements(1, true);
  }, [filters, refreshKey]);

  const lastElementRef = useCallback((node: any) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const next = prev + 1;
          fetchRequirements(next);
          return next;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  return (
    <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-8">Flatmate Requirements</h1>

        {requirements.length === 0 && !loading && (
          <div className="text-center py-20 text-slate-400 font-bold">No requirements found.</div>
        )}

        {requirements.map((req, index) => {
          const isLast = index === requirements.length - 1;
          const isSelected = selectedId === req._id;
          const isSaved = savedIds.includes(req._id);

          return (
            <div
              key={req._id}
              ref={isLast ? lastElementRef : null}
              onClick={() => onSelect(req)}
              className={`bg-white rounded-[2rem] p-6 border-2 cursor-pointer transition-all ${
                isSelected ? 'border-indigo-500 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* TOP ROW: Avatar + Name + Heart */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-xl ${
                      req.genderPreference === 'Female' ? 'bg-pink-500' : 'bg-indigo-500'
                    }`}
                  >
                    {req.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">{req.name}</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{req.alias || 'Resident'}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSave(e, req._id); }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm border ${
                    isSaved ? 'bg-red-500 text-white border-red-400' : 'bg-slate-50 text-slate-300 border-slate-200 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* BUDGET ROW: All the way left below name icon area */}
              <div className="mb-6 ml-1 flex items-center">
                 <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-sm font-black tracking-widest border-2 border-emerald-100 shadow-sm">
                    ₹{req.budget?.min?.toLocaleString() || '0'} – ₹{req.budget?.max?.toLocaleString() || '0'}
                 </div>
              </div>

              {/* BADGES ROW: BHK + Locations */}
              <div className="flex flex-wrap gap-2 mb-4">
                {/* BHK Preference */}
                {req.bhkPreference !== undefined && req.bhkPreference !== null && (
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1.5 border border-indigo-100">
                    <Bed className="w-3 h-3" />
                    {req.bhkPreference === 0.5 ? '1RK' : `${req.bhkPreference} BHK`}
                  </span>
                )}
                {/* Preferred Locations */}
                {req.preferredLocations?.map((loc: string, i: number) => (
                  <span
                    key={i}
                    className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" /> {loc}
                  </span>
                ))}
              </div>

              {/* FOOTER ROW: Move-in date + Gender */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-500">
                    Move in: {new Date(req.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${req.genderPreference === 'Female' ? 'text-pink-400' : 'text-indigo-400'}`} />
                  <span className="text-xs font-bold text-slate-500">Prefers: {req.genderPreference || 'Any'}</span>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="text-center py-6 text-indigo-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default FlatmateList;
