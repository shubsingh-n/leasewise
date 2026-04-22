import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Phone, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { requestContact } from '../../services/api';

interface ContactRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingType: 'Property' | 'Flatmate';
  listingTitle: string;
}

const ContactRequestModal: React.FC<ContactRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  listingId, 
  listingType,
  listingTitle 
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('requesterName');
    const savedPhone = localStorage.getItem('requesterPhone');
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      await requestContact({
        requesterName: name,
        requesterPhone: phone,
        listingId,
        listingType
      });

      // Save for future use
      localStorage.setItem('requesterName', name);
      localStorage.setItem('requesterPhone', phone);
      
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Failed to request contact:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Safe Contact Request</div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight uppercase tracking-tighter">
                  Connect with Host
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Request Sent!</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
                    Your details have been sent to the Listing Owner. They will reach out to you on WhatsApp shortly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100/50 mb-6">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Listing Reference</span>
                    </div>
                    <div className="text-sm font-black text-slate-800 truncate">{listingTitle}</div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Your Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          required
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: John Doe"
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">WhatsApp Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {status === 'error' && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center border border-red-100">
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Request
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  🛡️ Your number is only shared with the host
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ContactRequestModal;
