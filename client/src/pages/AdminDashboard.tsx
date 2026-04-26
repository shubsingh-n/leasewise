import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Users, RefreshCw, ChevronDown, ChevronUp, Phone, MapPin, Bed, Calendar, Send, Mail, Info, Tag, Square, Hammer, 
  History, User, Save, CheckCircle, XCircle, Edit2, Trash2, LogOut, Shield
} from 'lucide-react';
import { getContactLogs, retriggerNotification, testTelegramSetup } from '../services/api';

const WhatsAppIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.54.26l.192-2.94 5.35-4.83c.23-.205-.05-.318-.358-.112l-6.613 4.16-2.85-.89c-.61-.19-.623-.61.127-.9l11.14-4.298c.51-.19.96.112.79.914z"/>
  </svg>
);

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
type Status = 'pending' | 'approved' | 'rejected' | 'fulfilled';

function authHeaders() {
  const token = sessionStorage.getItem('admin_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'pending') as Status;
  const cfg: Record<Status, { cls: string; label: string }> = {
    pending:  { cls: 'bg-amber-100 text-amber-700 border-amber-200',       label: 'Pending'  },
    approved: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
    rejected: { cls: 'bg-red-100 text-red-700 border-red-200',             label: 'Rejected' },
    fulfilled: { cls: 'bg-indigo-100 text-indigo-700 border-indigo-200',   label: 'Fulfilled' },
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${cfg[s].cls}`}>
      {cfg[s].label}
    </span>
  );
}

function DetailItem({ label, value, icon, fullWidth, editable, onUpdate }: { 
  label: string; value: any; icon?: React.ReactNode; fullWidth?: boolean; 
  editable?: boolean; onUpdate?: (val: string) => void 
}) {
  const displayValue = (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) ? 'N/A' : value;
  
  return (
    <div className={`bg-slate-50 rounded-xl p-3 ${fullWidth ? 'col-span-2 md:col-span-3' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-indigo-400">{icon}</span>}
        <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{label}</div>
      </div>
      <div className="font-black text-slate-800 break-words">
        {editable ? (
          <input 
            type="text" 
            value={value || ''} 
            onChange={e => onUpdate?.(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-indigo-400"
          />
        ) : (
          <>
            {Array.isArray(displayValue) ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {displayValue.map((item, i) => (
                  <span key={i} className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">{item}</span>
                ))}
              </div>
            ) : typeof displayValue === 'boolean' ? (
              displayValue ? 'Yes' : 'No'
            ) : (
              displayValue
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ListingCard({
  item, isProperty, actionLoading, onApprove, onReactivate, onReject, onDelete, onUpdate
}: {
  item: any;
  isProperty: boolean;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReactivate: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(item);

  const status = (item.status || 'pending') as Status;
  const borderCls = status === 'approved' ? 'border-emerald-200' : status === 'rejected' ? 'border-red-200' : status === 'fulfilled' ? 'border-indigo-200' : 'border-amber-200';

  const handleSave = () => {
    onUpdate(item._id, editData);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditData(item);
    setIsEditing(false);
  };

  const getActiveDate = () => {
    if (!item.expiresAt) return null;
    const d = new Date(item.expiresAt);
    d.setDate(d.getDate() - 10);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDaysPending = () => {
    if (!item.expiresAt) return null;
    const diff = new Date(item.expiresAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${borderCls}`}>
      {/* HEADER ROW */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0 ${
          isProperty ? 'bg-indigo-500' : item.genderPreference === 'Female' ? 'bg-pink-500' : 'bg-indigo-500'
        }`}>
          {isProperty ? <Home className="w-4 h-4" /> : (item.name || '?').charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-slate-800 text-sm truncate">{isProperty ? item.title : item.name}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            {isProperty
              ? `₹${item.price?.toLocaleString() || 'N/A'}/mo · ${item.bhk === 0.5 ? '1RK' : item.bhk ? `${item.bhk} BHK` : 'N/A'}`
              : `₹${item.budget?.min?.toLocaleString() || '0'} – ₹${item.budget?.max?.toLocaleString() || '0'} · ${item.genderPreference || 'Any'}`}
            {item.expiresAt && (
              <span className="text-indigo-500 font-bold">
                {' · '}Deactivating in: {getDaysPending()} days
              </span>
            )}
          </div>
        </div>
        {item.expiresAt && (item.status === 'approved' || item.status === 'fulfilled') && (
          <div className="text-right hidden sm:block mr-2">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Approved On</div>
            <div className="text-xs font-bold text-slate-600">{getActiveDate()}</div>
          </div>
        )}
        <StatusBadge status={item.status} />
        {open ? <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />}
      </div>

      {/* EXPANDED */}
      {open && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {isProperty ? (
              <>
                <DetailItem label="Title" value={editData.title} editable={isEditing} onUpdate={v => setEditData({...editData, title: v})} icon={<Info className="w-3 h-3"/>} />
                <DetailItem label="Price" value={editData.price} editable={isEditing} onUpdate={v => setEditData({...editData, price: Number(v)})} icon={<Tag className="w-3 h-3"/>} />
                <DetailItem label="Deposit" value={editData.deposit} editable={isEditing} onUpdate={v => setEditData({...editData, deposit: Number(v)})} icon={<Tag className="w-3 h-3"/>} />
                <DetailItem label="Maintenance" value={editData.maintenance} editable={isEditing} onUpdate={v => setEditData({...editData, maintenance: Number(v)})} icon={<Tag className="w-3 h-3"/>} />
                <DetailItem label="BHK" value={editData.bhk} editable={isEditing} onUpdate={v => setEditData({...editData, bhk: Number(v)})} icon={<Bed className="w-3 h-3"/>} />
                <DetailItem label="Size" value={editData.size} editable={isEditing} onUpdate={v => setEditData({...editData, size: Number(v)})} icon={<Square className="w-3 h-3"/>} />
                <DetailItem label="Furnishing" value={editData.furnishing} editable={isEditing} onUpdate={v => setEditData({...editData, furnishing: v})} icon={<Hammer className="w-3 h-3"/>} />
                <div className={`bg-slate-50 rounded-xl p-3 col-span-2 md:col-span-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-3 h-3 text-indigo-400" />
                    <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Description</div>
                  </div>
                  {isEditing ? (
                    <textarea 
                      value={editData.description} 
                      onChange={e => setEditData({...editData, description: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-indigo-400 min-h-[60px]"
                    />
                  ) : (
                    <div className="font-black text-slate-800 break-words leading-relaxed">{item.description || 'N/A'}</div>
                  )}
                </div>
                <DetailItem label="Locality Tags" value={item.localityTags} icon={<MapPin className="w-3 h-3"/>} />
                <DetailItem label="Availability" value={item.availability ? new Date(item.availability).toLocaleDateString() : 'N/A'} icon={<Calendar className="w-3 h-3"/>} />
                <DetailItem label="Contact Name" value={editData.contact?.name} editable={isEditing} onUpdate={v => setEditData({...editData, contact: {...editData.contact, name: v}})} icon={<Users className="w-3 h-3"/>} />
                <DetailItem label="WhatsApp Number" value={editData.contact?.whatsapp} editable={isEditing} onUpdate={v => setEditData({...editData, contact: {...editData.contact, whatsapp: v}})} icon={<Phone className="w-3 h-3"/>} />
                <DetailItem label="Contact Email" value={editData.contact?.email} editable={isEditing} onUpdate={v => setEditData({...editData, contact: {...editData.contact, email: v}})} icon={<Mail className="w-3 h-3"/>} />
              </>
            ) : (
              <>
                <DetailItem label="Name" value={editData.name} editable={isEditing} onUpdate={v => setEditData({...editData, name: v})} icon={<Users className="w-3 h-3"/>} />
                <DetailItem label="Alias" value={editData.alias} editable={isEditing} onUpdate={v => setEditData({...editData, alias: v})} icon={<Tag className="w-3 h-3"/>} />
                <DetailItem label="Min Budget" value={editData.budget?.min} editable={isEditing} onUpdate={v => setEditData({...editData, budget: {...editData.budget, min: Number(v)}})} icon={<Tag className="w-3 h-3"/>} />
                <DetailItem label="Max Budget" value={editData.budget?.max} editable={isEditing} onUpdate={v => setEditData({...editData, budget: {...editData.budget, max: Number(v)}})} icon={<Tag className="w-3 h-3"/>} />
                <DetailItem label="BHK Preference" value={editData.bhkPreference} editable={isEditing} onUpdate={v => setEditData({...editData, bhkPreference: Number(v)})} icon={<Bed className="w-3 h-3"/>} />
                <DetailItem label="Property Type" value={editData.propertyType} editable={isEditing} onUpdate={v => setEditData({...editData, propertyType: v})} icon={<Home className="w-3 h-3"/>} />
                <DetailItem label="Furnishing Pref" value={editData.furnishingPreference} editable={isEditing} onUpdate={v => setEditData({...editData, furnishingPreference: v})} icon={<Hammer className="w-3 h-3"/>} />
                <DetailItem label="Gender Pref" value={editData.genderPreference} editable={isEditing} onUpdate={v => setEditData({...editData, genderPreference: v})} icon={<Users className="w-3 h-3"/>} />
                <DetailItem label="Move-In Date" value={item.moveInDate ? new Date(item.moveInDate).toLocaleDateString() : 'N/A'} icon={<Calendar className="w-3 h-3"/>} />
                <DetailItem label="Locations" value={item.preferredLocations?.join(', ')} icon={<MapPin className="w-3 h-3"/>} />
                <DetailItem label="Preferences" value={item.preferences?.join(', ')} icon={<Info className="w-3 h-3"/>} />
                
                <div className={`bg-slate-50 rounded-xl p-3 col-span-2 md:col-span-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-3 h-3 text-indigo-400" />
                    <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Notes</div>
                  </div>
                  {isEditing ? (
                    <textarea 
                      value={editData.notes} 
                      onChange={e => setEditData({...editData, notes: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-indigo-400 min-h-[60px]"
                    />
                  ) : (
                    <div className="font-black text-slate-800 break-words leading-relaxed">{item.notes || 'N/A'}</div>
                  )}
                </div>
                <DetailItem label="Contact Email" value={editData.contact?.email} editable={isEditing} onUpdate={v => setEditData({...editData, contact: {...editData.contact, email: v}})} icon={<Mail className="w-3 h-3"/>} />
                <DetailItem label="WhatsApp Number" value={editData.contact?.whatsapp} editable={isEditing} onUpdate={v => setEditData({...editData, contact: {...editData.contact, whatsapp: v}})} icon={<Phone className="w-3 h-3"/>} />
              </>
            )}
            
            {/* ACTIVE LISTING LIMITS MONITORING */}
            <div className="col-span-2 md:col-span-3 mt-2 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <div className={`px-3 py-1.5 rounded-xl border-2 flex items-center gap-2 transition-all ${item.activePropertyCount >= 2 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                <Home className={`w-3.5 h-3.5 ${(item.activePropertyCount ?? 0) >= 2 ? 'text-rose-500' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${(item.activePropertyCount ?? 0) >= 2 ? 'text-rose-600' : 'text-slate-600'}`}>
                  Active Flats: {item.activePropertyCount ?? 0}
                </span>
                {(item.activePropertyCount ?? 0) === 2 && <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">Limit Reached</span>}
                {(item.activePropertyCount ?? 0) > 2 && <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase animate-pulse">EXCEEDED</span>}
              </div>
              <div className={`px-3 py-1.5 rounded-xl border-2 flex items-center gap-2 transition-all ${item.activeRequirementCount >= 2 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                <Users className={`w-3.5 h-3.5 ${(item.activeRequirementCount ?? 0) >= 2 ? 'text-rose-500' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${(item.activeRequirementCount ?? 0) >= 2 ? 'text-rose-600' : 'text-slate-600'}`}>
                  Active Req: {item.activeRequirementCount ?? 0}
                </span>
                {(item.activeRequirementCount ?? 0) === 2 && <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">Limit Reached</span>}
                {(item.activeRequirementCount ?? 0) > 2 && <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase animate-pulse">EXCEEDED</span>}
              </div>
            </div>
          </div>

          {/* REJECT REASON INPUT */}
          {rejectOpen && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-black text-red-700 uppercase tracking-wider">Reason for rejection (optional)</div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={2}
                placeholder="e.g. Incomplete details, suspicious listing…"
                className="w-full text-sm text-slate-800 bg-white border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
              <div className="flex gap-2">
                <button
                  disabled={!!actionLoading}
                  onClick={() => { onReject(item._id, rejectReason); setRejectOpen(false); setRejectReason(''); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-400 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {actionLoading === `${item._id}-reject` ? 'Rejecting…' : 'Confirm Reject'}
                </button>
                <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-100"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {item.status !== 'approved' && (
                  <button
                    disabled={!!actionLoading}
                    onClick={() => onApprove(item._id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-emerald-100"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading === `${item._id}-approve` ? 'Approving…' : 'Approve'}
                  </button>
                )}
                {item.status !== 'rejected' && !rejectOpen && (
                  <button
                    disabled={!!actionLoading}
                    onClick={() => setRejectOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-400 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-red-100"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                )}
                <button
                  disabled={!!actionLoading}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-100 active:scale-95 transition-all"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                {(item.status === 'approved' || item.status === 'fulfilled') && (
                  <button
                    disabled={!!actionLoading}
                    onClick={() => onReactivate(item._id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-100"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading === `${item._id}-reactivate` ? 'animate-spin' : ''}`} />
                    {actionLoading === `${item._id}-reactivate` ? 'Reactivating…' : 'Reactivate'}
                  </button>
                )}
                {item.status === 'approved' && (
                  <button
                    disabled={!!actionLoading}
                    onClick={() => onUpdate(item._id, { status: 'fulfilled' })}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest hover:bg-indigo-200 active:scale-95 transition-all shadow-md shadow-indigo-50"
                  >
                    <CheckCircle className={`w-4 h-4 ${actionLoading === `${item._id}-update` ? 'animate-spin' : ''}`} />
                    {actionLoading === `${item._id}-update` ? 'Processing…' : 'Mark Fulfilled'}
                  </button>
                )}
                <button
                  disabled={!!actionLoading}
                  onClick={() => { if (window.confirm('Delete permanently?')) onDelete(item._id); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all disabled:opacity-50 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {actionLoading === `${item._id}-delete` ? 'Deleting…' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusSection({
  label, items, color, isProperty, actionLoading, onApprove, onReactivate, onReject, onDelete, onUpdate
}: {
  label: string; items: any[]; color: string; isProperty: boolean;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReactivate: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
}) {
  return (
    <div className="mb-8">
      <div className={`flex items-center gap-2 mb-3 px-1`}>
        <span className={`text-xs font-black uppercase tracking-widest ${color}`}>{label}</span>
        <span className="text-xs font-bold text-slate-400">({items.length})</span>
        <div className="flex-1 h-[1px] bg-slate-200 ml-2" />
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-slate-300 font-bold italic px-1 pb-4">Nothing here.</div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ListingCard
              key={item._id}
              item={item}
              isProperty={isProperty}
              actionLoading={actionLoading}
              onApprove={onApprove}
              onReactivate={onReactivate}
              onReject={onReject}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactLogsSection({ logs, onRefresh }: { logs: any[]; onRefresh: () => void }) {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    if (!dateRange.start && !dateRange.end) return true;
    const date = new Date(log.createdAt);
    if (dateRange.start && date < new Date(dateRange.start)) return false;
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      if (date > endDate) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Requester Name', 'Requester Phone', 'Listing Title', 'Listing Type', 'Owner Name', 'Owner Phone', 'Status'];
    const rows = filteredLogs.map(log => [
      new Date(log.createdAt).toLocaleDateString(),
      new Date(log.createdAt).toLocaleTimeString(),
      `"${log.requesterName}"`,
      `"${log.requesterPhone}"`,
      `"${log.listingTitle}"`,
      log.listingType,
      `"${log.ownerName}"`,
      `"${log.ownerPhone}"`,
      log.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ncr_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetrigger = async (logId: string) => {
    setActionLoading(logId);
    try {
      await retriggerNotification(logId);
      alert('Notification re-sent successfully!');
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestTelegram = async () => {
    try {
      await testTelegramSetup();
      alert('Test message sent! Check your Telegram.');
    } catch (err: any) {
      alert(`Telegram Error: ${err.message}`);
    }
  };

  const openWhatsApp = (log: any) => {
    const cleanPhone = log.ownerPhone.replace(/[^\d]/g, '');
    const msg = encodeURIComponent(`Hi ${log.ownerName}, I'm the admin. A user named ${log.requesterName} (${log.requesterPhone}) is interested in your listing: "${log.listingTitle}".`);
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Lead Management</span>
          <span className="text-xs font-bold text-slate-400">({filteredLogs.length})</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="text-[10px] font-black uppercase bg-transparent outline-none px-2 py-1"
            />
            <span className="text-slate-300">→</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="text-[10px] font-black uppercase bg-transparent outline-none px-2 py-1"
            />
          </div>
          
          <button 
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md shadow-slate-200"
          >
            <History className="w-3.5 h-3.5" /> Export CSV
          </button>
          
          <button 
            onClick={handleTestTelegram}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <Shield className="w-3.5 h-3.5" /> Test Bot
          </button>
        </div>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs">
          No contact requests found yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing Owner</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log: any) => (
                <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-800">{new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase mt-0.5">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 uppercase"><User className="w-3 h-3 text-indigo-400" /> {log.requesterName}</span>
                      <span className="text-[10px] text-indigo-600 font-black tracking-widest mt-1 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block w-fit">{log.requesterPhone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-800 truncate max-w-[180px]">{log.listingTitle}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded-md w-fit">{log.listingType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-800 uppercase">{log.ownerName}</span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-tight mt-0.5">{log.ownerPhone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => openWhatsApp(log)}
                        title="Send WhatsApp to Owner"
                        className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-md shadow-emerald-100"
                       >
                         <WhatsAppIcon />
                       </button>

                       <button 
                         onClick={() => handleRetrigger(log._id)}
                         disabled={actionLoading === log._id}
                         title="Resend Telegram Notification"
                         className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md shadow-indigo-100
                           ${log.status === 'notified' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}
                           ${actionLoading === log._id ? 'animate-pulse opacity-50' : 'hover:scale-110 active:scale-95'}
                         `}
                       >
                         <TelegramIcon />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [flatmates, setFlatmates] = useState<any[]>([]);
  const [contactLogs, setContactLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'properties' | 'flatmates' | 'contact-requests'>('properties');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const fetchListings = useCallback(async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) { setAuthError(true); return; }
    setLoading(true);
    try {
      // Add timestamp to bypass any browser cache
      const res = await fetch(`${API}/admin/listings?t=${Date.now()}`, { headers: authHeaders() });
      if (res.status === 401) { setAuthError(true); return; }
      const data = await res.json();
      setProperties(data.properties || []);
      setFlatmates(data.flatmates || []);
      
      // Fetch contact logs too
      try {
        const logsData = await getContactLogs();
        setContactLogs(logsData || []);
      } catch (err) {
        console.error('Failed to fetch contact logs:', err);
      }
    } catch {
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const doAction = async (type: 'properties' | 'flatmates', id: string, verb: 'approve' | 'reject' | 'delete' | 'update' | 'reactivate', data?: any) => {
    setActionLoading(`${id}-${verb}`);
    try {
      let method = 'PATCH';
      let url = `${API}/admin/${type}/${id}`;
      
      if (verb === 'delete') {
        method = 'DELETE';
      } else if (verb !== 'update') {
        url += `/${verb}`;
      }

      // If rejecting, wrap reason in an object
      const body = verb === 'reject' ? { reason: data } : (data ? data : undefined);

      const res = await fetch(url, { 
        method, 
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.message || 'Operation failed'}`);
      } else {
        // Success! Refresh immediately
        await fetchListings();
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const items = tab === 'properties' ? properties : flatmates;
  const pending  = items.filter(i => !i.status || i.status === 'pending');
  const approved = items.filter(i => i.status === 'approved');
  const fulfilled = items.filter(i => i.status === 'fulfilled');
  const rejected = items.filter(i => i.status === 'rejected');

  const totalPending = properties.filter(p => !p.status || p.status === 'pending').length
    + flatmates.filter(f => !f.status || f.status === 'pending').length;

  const logout = () => { sessionStorage.removeItem('admin_token'); navigate('/admin/login'); };

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Session Expired</h2>
          <p className="text-slate-400 mb-6 text-sm">Please log in again to continue.</p>
          <button onClick={() => navigate('/admin/login')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-y-auto">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-slate-800 tracking-tight">Admin</span>
            {totalPending > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{totalPending} pending</span>
            )}
          </div>

          {/* TYPE TABS — compact, all in one line */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 gap-0.5">
            <button
              onClick={() => setTab('properties')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${tab === 'properties' ? 'bg-white text-indigo-600 shadow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Home className="w-3.5 h-3.5" /> Flats <span className="opacity-60">({properties.length})</span>
            </button>
            <button
              onClick={() => setTab('flatmates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${tab === 'flatmates' ? 'bg-white text-indigo-600 shadow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users className="w-3.5 h-3.5" /> Flatmates <span className="opacity-60">({flatmates.length})</span>
            </button>
            <button
              onClick={() => setTab('contact-requests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${tab === 'contact-requests' ? 'bg-white text-indigo-600 shadow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <History className="w-3.5 h-3.5" /> Leads <span className="opacity-60">({contactLogs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={fetchListings} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 text-[11px] font-black uppercase tracking-wider transition-all">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT — scrollable */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 overflow-y-visible">
        {loading ? (
          <div className="text-center py-24 text-indigo-400 font-bold uppercase tracking-widest text-sm animate-pulse">Loading…</div>
        ) : tab === 'contact-requests' ? (
          <ContactLogsSection logs={contactLogs} onRefresh={fetchListings} />
        ) : (
          <>
            <StatusSection
              label="⏳ Pending Review"
              color="text-amber-600"
              items={pending}
              isProperty={tab === 'properties'}
              actionLoading={actionLoading}
              onApprove={id => doAction(tab, id, 'approve')}
              onReactivate={id => doAction(tab, id, 'reactivate')}
              onReject={(id, reason) => doAction(tab, id, 'reject', reason)}
              onDelete={id => doAction(tab, id, 'delete')}
              onUpdate={(id, data) => doAction(tab, id, 'update', data)}
            />
            <StatusSection
              label="✅ Approved"
              color="text-emerald-600"
              items={approved}
              isProperty={tab === 'properties'}
              actionLoading={actionLoading}
              onApprove={id => doAction(tab, id, 'approve')}
              onReactivate={id => doAction(tab, id, 'reactivate')}
              onReject={(id, reason) => doAction(tab, id, 'reject', reason)}
              onDelete={id => doAction(tab, id, 'delete')}
              onUpdate={(id, data) => doAction(tab, id, 'update', data)}
            />
            <StatusSection
              label="❌ Rejected"
              color="text-red-500"
              items={rejected}
              isProperty={tab === 'properties'}
              actionLoading={actionLoading}
              onApprove={id => doAction(tab, id, 'approve')}
              onReactivate={id => doAction(tab, id, 'reactivate')}
              onReject={(id, reason) => doAction(tab, id, 'reject', reason)}
              onDelete={id => doAction(tab, id, 'delete')}
              onUpdate={(id, data) => doAction(tab, id, 'update', data)}
            />
            <StatusSection
              label="🏁 Fulfilled / Closed"
              color="text-indigo-500"
              items={fulfilled}
              isProperty={tab === 'properties'}
              actionLoading={actionLoading}
              onApprove={id => doAction(tab, id, 'reactivate')}
              onReactivate={id => doAction(tab, id, 'reactivate')}
              onReject={(id, reason) => doAction(tab, id, 'reject', reason)}
              onDelete={id => doAction(tab, id, 'delete')}
              onUpdate={(id, data) => doAction(tab, id, 'update', data)}
            />
          </>
        )}
      </div>
    </div>
  );
}
