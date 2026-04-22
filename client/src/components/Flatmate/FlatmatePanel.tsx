import React from 'react';
import { X, MessageSquare, Heart, User, Calendar, MapPin, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContactRequestModal from '../Modals/ContactRequestModal';

interface FlatmatePanelProps {
  req: any | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
}

const obfuscatePhone = (phone: string) => {
  if (!phone) return 'N/A';
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length < 5) return phone;
  return `${phone.substring(0, 4)} XXX-XX${phone.substring(phone.length - 2)}`;
};

const FlatmatePanel: React.FC<FlatmatePanelProps> = ({ req, onClose, isSaved, onToggleSave }) => {
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

  if (!req) return null;

  const genderColor =
    req.genderPreference === 'Female'
      ? 'text-pink-600 bg-pink-50 border-pink-100'
      : req.genderPreference === 'Male'
      ? 'text-blue-600 bg-blue-50 border-blue-100'
      : 'text-slate-600 bg-slate-50 border-slate-100';

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 w-full md:w-[440px] h-full bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.1)] z-[60] flex flex-col border-l border-slate-200"
      >
        {/* TOP ACTIONS */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={onToggleSave}
            className={`p-4 rounded-[1.2rem] shadow-2xl backdrop-blur-xl transition-all active:scale-95 border-2
              ${isSaved ? 'bg-red-500 text-white border-red-400' : 'bg-white/95 text-slate-400 border-white hover:text-red-500'}`}
          >
            <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={onClose}
            className="p-4 bg-white/95 backdrop-blur-xl rounded-[1.2rem] shadow-2xl hover:bg-white text-slate-800 transition-all active:scale-95 border-2 border-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pt-20">
          {/* AVATAR + NAME */}
          <div className="mb-10 text-center">
            <div
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center font-black text-white text-4xl mb-4 shadow-xl ${
                req.genderPreference === 'Female'
                  ? 'bg-pink-500 shadow-pink-200'
                  : 'bg-indigo-500 shadow-indigo-200'
              }`}
            >
              {req.name.charAt(0)}
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-1">{req.name}</h2>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{req.alias}</span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Listed on {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* BUDGET */}
          <div className="bg-slate-50 rounded-[2rem] p-6 mb-8 border-2 border-slate-100 text-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Budget Range</div>
            <div className="text-3xl font-black text-emerald-600 tracking-tighter">
              ₹{req.budget.min.toLocaleString()} <span className="text-slate-300 mx-2">-</span> ₹{req.budget.max.toLocaleString()}
            </div>
          </div>

          {/* ABOUT ME & NEEDS */}
          <div className="mb-8">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">About Me &amp; Needs</h3>
            <div className="space-y-3 mb-4">
              {/* Gender */}
              <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 ${genderColor}`}>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Gender Preference</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest">
                  {req.genderPreference || 'Any'}
                </span>
              </div>

              {/* Moving Date */}
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50 text-indigo-700">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Moving Date</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest">
                  {req.moveInDate
                    ? new Date(req.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Flexible'}
                </span>
              </div>

              {/* BHK Preference */}
              {req.bhkPreference !== undefined && req.bhkPreference !== null && (
                <div className="flex items-center justify-between px-5 py-4 rounded-2xl border-2 border-amber-100 bg-amber-50 text-amber-700">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">BHK Preference</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">
                    {req.bhkPreference === 0.5 ? '1RK' : `${req.bhkPreference} BHK`}
                  </span>
                </div>
              )}
            </div>

            {/* Notes / bio text */}
            {req.notes && (
              <p className="text-slate-600 font-medium leading-relaxed text-sm bg-slate-50 rounded-2xl p-4 border border-slate-100">
                {req.notes}
              </p>
            )}
          </div>

          {/* PREFERRED LOCATIONS */}
          {req.preferredLocations && req.preferredLocations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Preferred Locations</h3>
              <div className="flex flex-wrap gap-2">
                {req.preferredLocations.map((loc: string, i: number) => (
                  <span
                    key={i}
                    className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3 text-indigo-500" /> {loc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PREFERENCES / AMENITIES */}
          {req.preferences && req.preferences.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {req.preferences.map((pref: string, i: number) => (
                  <span
                    key={i}
                    className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="p-6 bg-white border-t border-slate-100 space-y-3">
          <button
             onClick={() => setIsContactModalOpen(true)}
             className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <MessageSquare className="w-5 h-5 fill-current" /> Request Connection
          </button>

        </div>

        <ContactRequestModal 
           isOpen={isContactModalOpen}
           onClose={() => setIsContactModalOpen(false)}
           listingId={req._id}
           listingType="Flatmate"
           listingTitle={`Flatmate Request - ${req.name}`}
        />
      </motion.aside>
    </AnimatePresence>
  );
};

export default FlatmatePanel;
