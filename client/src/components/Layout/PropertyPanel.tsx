import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Bed, Maximize, Shield, Wifi, Car, Zap, 
  Phone, Navigation, Calendar, Info, ChevronLeft, ChevronRight,
  ExternalLink, Compass, Dog, Heart, MessageCircle, Lock
} from 'lucide-react';
import ContactRequestModal from '../Modals/ContactRequestModal';

interface PropertyPanelProps {
  property: any | null;
  onClose: () => void;
  userLocation: [number, number] | null;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
}

const obfuscatePhone = (phone: string) => {
  if (!phone) return 'N/A';
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length < 5) return phone;
  return `${phone.substring(0, 4)} XXX-XX${phone.substring(phone.length - 2)}`;
};

// Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            // @ts-ignore
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  if (d < 1) return `${(d * 1000).toFixed(0)}m`;
  return `${d.toFixed(1)}km`;
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({ property, onClose, userLocation, isSaved, onToggleSave }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  if (!property) return null;

  const amenityIcons: { [key: string]: any } = {
    "Gym": <Shield className="w-4 h-4" />,
    "Power Backup": <Zap className="w-4 h-4" />,
    "Lift": <Navigation className="w-4 h-4 rotate-180" />,
    "Security": <Shield className="w-4 h-4" />,
    "Parking": <Car className="w-4 h-4" />,
    "WiFi": <Wifi className="w-4 h-4" />,
  };

  const images = property.images && property.images.length > 0 
    ? property.images 
    : ["https://images.unsplash.com/photo-1560448204-61dc36dc98c8"];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const distanceFromUser = userLocation && property.location 
    ? calculateDistance(userLocation[1], userLocation[0], property.location.coordinates[1], property.location.coordinates[0])
    : null;

  const handleGetDirections = () => {
    const [lng, lat] = property.location.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <AnimatePresence>
      {property && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="fixed right-0 top-0 h-full w-full md:w-[440px] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.15)] z-[60] overflow-y-auto font-sans"
        >
          {/* HEADER ACTIONS */}
          <div className="absolute top-6 left-6 flex gap-3 z-10">
             <button 
                onClick={onToggleSave}
                className={`p-4 rounded-[1.2rem] shadow-2xl backdrop-blur-xl transition-all active:scale-95 border-2
                  ${isSaved ? "bg-red-500 text-white border-red-400" : "bg-white/95 text-slate-400 border-white hover:text-red-500"}`}
              >
                <Heart className={`w-6 h-6 ${isSaved ? "fill-current" : ""}`} />
              </button>
          </div>

          <div className="absolute top-6 right-6 flex gap-3 z-10">
             <button 
              onClick={handleGetDirections}
              className="p-4 bg-white/95 backdrop-blur-xl rounded-[1.2rem] shadow-2xl hover:bg-white text-indigo-600 transition-all active:scale-95 border-2 border-white"
              title="Get Directions"
            >
              <ExternalLink className="w-6 h-6" />
            </button>
            <button 
              onClick={onClose}
              className="p-4 bg-white/95 backdrop-blur-xl rounded-[1.2rem] shadow-2xl hover:bg-white text-slate-800 transition-all active:scale-95 border-2 border-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* IMAGE CAROUSEL */}
          <div className="relative w-full h-[320px] bg-slate-900 overflow-hidden cursor-pointer group" onClick={() => setIsFullscreen(true)}>
            <AnimatePresence initial={false} mode="wait">
              <motion.img 
                key={currentImageIndex}
                src={images[currentImageIndex]}
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none" />

            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-white/40 transition-all border border-white/20">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-white/40 transition-all border border-white/20">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/20 backdrop-blur-xl rounded-full">
                  {images.map((_: any, i: number) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentImageIndex ? "bg-white w-8" : "bg-white/40 w-1.5"}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* CONTENT */}
          <div className="p-10">
            {property.femaleOnly && (
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-3.5 rounded-2xl flex items-center gap-3 mb-6 font-black uppercase text-xs tracking-widest shadow-lg shadow-pink-200 border-2 border-pink-400/50">
                 <Shield className="w-5 h-5 fill-current" />
                 Female Only Property
              </div>
            )}
            <div className="flex justify-between items-start mb-10">
              <div className="flex-1 pr-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">Property Details</span>
                  {property.petFriendly && (
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50 flex items-center gap-1.5">
                       <Dog className="w-3.5 h-3.5" /> Pets Allowed
                    </span>
                  )}
                  {property.parkingAvailable && (
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-2 py-1 rounded-lg border border-blue-100/50 flex items-center gap-1.5">
                       <Car className="w-3.5 h-3.5" /> Parking
                    </span>
                  )}
                  {property.furnishing && (
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50 capitalize">
                      {property.furnishing.replace(/-/g, ' ')}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-800 leading-[1.1] uppercase tracking-tighter mb-3">{property.title}</h2>
                {property.localityTags && property.localityTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      <Calendar className="w-3 h-3 text-indigo-500" /> Listed on {new Date(property.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {property.localityTags.map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        <MapPin className="w-3 h-3 text-indigo-500" />{tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center text-slate-400 font-bold">
                      <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                      <span className="text-sm tracking-wide">Delhi NCR</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Listed on {new Date(property.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PRICING TABLE */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border-2 border-slate-100 flex flex-col items-center">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rent</div>
                <div className="text-lg font-black text-slate-800 tracking-tighter">₹{property.price.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border-2 border-slate-100 flex flex-col items-center">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Deposit</div>
                <div className="text-lg font-black text-slate-800 tracking-tighter">
                  {property.deposit ? `₹${property.deposit.toLocaleString()}` : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border-2 border-slate-100 flex flex-col items-center">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Maint.</div>
                <div className="text-lg font-black text-slate-800 tracking-tighter">
                  {property.maintenance ? `₹${property.maintenance.toLocaleString()}` : 'N/A'}
                </div>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="flex flex-col items-center p-4 bg-indigo-50/30 rounded-[1.5rem] border-2 border-indigo-100/30 group hover:bg-indigo-50 transition-colors">
                <Bed className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {property.bhk === 0.5 ? '1RK' : `${property.bhk} BHK`}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-indigo-50/30 rounded-[1.5rem] border-2 border-indigo-100/30 group hover:bg-indigo-50 transition-colors">
                <Maximize className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{property.size} sqft</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-indigo-50/30 rounded-[1.5rem] border-2 border-indigo-100/30 group hover:bg-indigo-50 transition-colors">
                <Calendar className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black text-slate-800 uppercase text-center leading-[1.2] tracking-tighter">
                  Available By<br/>
                  <span className="text-[10px]">{property.availability ? new Date(property.availability).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Immediate'}</span>
                </span>
              </div>
            </div>

            {/* COMMUTE SECTION */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                  <Compass className="w-6 h-6 text-indigo-600" />
                  Proximity & Transit
                </h3>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border-2 border-slate-100 group hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black shadow-inner">
                      <Navigation className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800">Your Live Location</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Direct Distance</div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-indigo-600">{distanceFromUser || 'GPS Off'}</div>
                </div>
              </div>
            </section>

            {/* AMENITIES */}
            {property.amenities && property.amenities.length > 0 && (
              <section className="mb-12">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6">Amenities</h3>
                <div className="grid grid-cols-2 gap-4">
                  {property.amenities.map((item: string) => (
                    <div key={item} className="flex items-center gap-4 text-slate-600 bg-slate-50 p-4 rounded-3xl border border-slate-100 transition-all hover:border-indigo-300 hover:shadow-md">
                      <div className="text-indigo-600 bg-white p-2.5 rounded-xl shadow-sm">{amenityIcons[item] || <Info className="w-5 h-5" />}</div>
                      <span className="text-sm font-black uppercase tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DESCRIPTION */}
            <section className="mb-12">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">About this Property</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-bold tracking-tight">
                {property.description}
              </p>
            </section>

            {/* CONTACT CARD */}
            <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-[0_20px_50px_rgba(79,70,229,0.2)]">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/20 border-2 border-indigo-500/30 overflow-hidden p-1">
                        <img src={`https://ui-avatars.com/api/?name=${property.contact?.name || 'Agent'}&background=6366f1&color=fff`} alt="" className="w-full h-full rounded-[1.2rem]" />
                     </div>
                     <div>
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Contact</div>
                        <div className="text-xl font-black tracking-tight">{property.contact?.name || "Premium Host"}</div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsContactModalOpen(true)}
                    className="w-full bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-[0_10px_20px_rgba(79,70,229,0.2)] border-2 border-indigo-600"
                  >
                    <MessageCircle className="w-5 h-5 fill-white" />
                    Request Contact Info
                  </button>
               </div>
            </section>
          </div>

          <ContactRequestModal 
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            listingId={property._id}
            listingType="Property"
            listingTitle={property.title}
          />
        </motion.div>
      )}

      {/* FULLSCREEN IMAGE MODAL */}
      {isFullscreen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10"
        >
          <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all">
            <X className="w-6 h-6" />
          </button>
          
          <img src={images[currentImageIndex]} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
          
          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 rounded-2xl text-white transition-all border border-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }} 
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 rounded-2xl text-white transition-all border border-white/10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PropertyPanel;
