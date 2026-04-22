import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CheckCircle, CheckSquare, Dog, Image as ImageIcon, MapPin, Shield, Square, Upload, Video, X } from 'lucide-react';
import { createFlatmateRequirement, createProperty } from '../../services/api';

type ListingMode = 'choose' | 'flat' | 'requirement';

type PropertyDraft = {
  title: string;
  description: string;
  price: string;
  deposit: string;
  maintenance: string;
  bhk: number | null;
  size: string;
  localityTags: string[];
  lat: string;
  lng: string;
  googlePinLink: string;
  amenities: string[];
  furnishing: 'unfurnished' | 'semi-furnished' | 'fully-furnished' | '';
  availability: string;
  contactName: string;
  contactWhatsapp: string;
  contactEmail: string;
  petFriendly: boolean;
  femaleOnly: boolean;
  parkingAvailable: boolean;
};

type RequirementDraft = {
  name: string;
  occupationPreset: 'Student' | 'Working professional' | 'Custom' | '';
  occupationCustom: string;
  minBudget: string;
  maxBudget: string;
  bhkPreference: number | 'PG' | 'Hostel' | null;
  preferredLocations: string[];
  moveInDate: string;
  genderPreference: 'Any' | 'Male' | 'Female';
  furnishingPreference: 'unfurnished' | 'semi-furnished' | 'fully-furnished' | '';
  notes: string;
  amenitiesPreference: string[];
  whatsapp: string;
  email: string;
};

const CHIP_PRESETS = {
  amenities: [
    'Room Sharing', 'WiFi', 'AC', 'Geyser', 'Metered Electricity',
    'Fridge', 'Washing Machine', 'Bed', 'Wardrobe', 'Connected Washroom',
    'Parking', 'Maid', 'Cook', 'Non Veg', 'Smoking/Alcohol Friendly',
    'Pet Friendly', 'Lift', 'Rented Furniture'
  ],
  occupations: ['Student', 'Working professional'],
  bhk: [
    { label: '1RK', value: 0.5 },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4+', value: 4 },
    { label: 'PG', value: 'PG' as const },
    { label: 'Hostel', value: 'Hostel' as const }
  ]
};

function normalizeWhatsApp(value: string) {
  const v = value.trim();
  if (!v) return '';
  if (v.includes('wa.me/')) return v;
  const digits = v.replace(/[^\d]/g, '');
  if (!digits) return v;
  return `https://wa.me/${digits}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function parseLatLngFromGoogleMapsLink(link: string): { lat: number; lng: number } | null {
  const input = link.trim();
  if (!input) return null;

  // Common pattern: .../@lat,lng,zoom...
  const atMatch = input.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (atMatch) return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) };

  // Common pattern: ...?q=lat,lng or ...?query=lat,lng
  const qMatch = input.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (qMatch) return { lat: Number(qMatch[1]), lng: Number(qMatch[2]) };

  // Fallback: "lat,lng" anywhere in the string
  const loose = input.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (loose) return { lat: Number(loose[1]), lng: Number(loose[2]) };

  return null;
}

function Chip({
  label,
  selected,
  onClick
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all ${selected ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
        }`}
    >
      {label}
    </button>
  );
}

function ChipInput({
  value,
  onChange,
  placeholder
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState('');

  const add = () => {
    const v = text.trim();
    if (!v) return;
    if (value.some(x => x.toLowerCase() === v.toLowerCase())) {
      setText('');
      return;
    }
    onChange([...value, v]);
    setText('');
  };

  const remove = (item: string) => onChange(value.filter(v => v !== item));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {value.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => remove(item)}
            className="px-3 py-2 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
            title="Click to remove"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function AddListingModal({
  isOpen,
  onClose,
  onCreated
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = useState<ListingMode>('choose');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkedContact, setCheckedContact] = useState(false);
  const [checkedLimit, setCheckedLimit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const fileInputImagesRef = useRef<HTMLInputElement | null>(null);
  const fileInputCameraImageRef = useRef<HTMLInputElement | null>(null);
  const fileInputVideosRef = useRef<HTMLInputElement | null>(null);

  const [property, setProperty] = useState<PropertyDraft>({
    title: '',
    description: '',
    price: '',
    deposit: '',
    maintenance: '',
    bhk: null,
    size: '',
    localityTags: [],
    lat: '',
    lng: '',
    googlePinLink: '',
    amenities: [],
    furnishing: '',
    availability: '',
    contactName: '',
    contactWhatsapp: '',
    contactEmail: '',
    petFriendly: false,
    femaleOnly: false,
    parkingAvailable: false
  });

  const [requirement, setRequirement] = useState<RequirementDraft>({
    name: '',
    occupationPreset: '',
    occupationCustom: '',
    minBudget: '',
    maxBudget: '',
    bhkPreference: null,
    preferredLocations: [],
    moveInDate: '',
    genderPreference: 'Any',
    furnishingPreference: '',
    notes: '',
    amenitiesPreference: [],
    whatsapp: '',
    email: ''
  });

  const resetAll = () => {
    setMode('choose');
    setSubmitting(false);
    setError(null);
    setIsSuccess(false);
    setImages([]);
    setVideos([]);
    setCheckedContact(false);
    setCheckedLimit(false);
    setErrors({});
    setProperty({
      title: '',
      description: '',
      price: '',
      deposit: '',
      maintenance: '',
      bhk: null,
      size: '',
      localityTags: [],
      lat: '',
      lng: '',
      googlePinLink: '',
      amenities: [],
      furnishing: '',
      availability: '',
      contactName: '',
      contactWhatsapp: '',
      contactEmail: '',
      petFriendly: false,
      femaleOnly: false,
      parkingAvailable: false
    });
    setRequirement({
      name: '',
      occupationPreset: '',
      occupationCustom: '',
      minBudget: '',
      maxBudget: '',
      bhkPreference: null,
      preferredLocations: [],
      moveInDate: '',
      genderPreference: 'Any',
      furnishingPreference: '',
      notes: '',
      amenitiesPreference: [],
      whatsapp: '',
      email: ''
    });
  };

  const close = () => {
    resetAll();
    onClose();
  };

  const validateField = (name: string, value: any, mode: ListingMode) => {
    let error = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (mode === 'flat') {
      switch (name) {
        case 'title':
          if (!value.trim()) error = 'Title is required';
          else if (value.trim().length < 10) error = 'Title must be at least 10 characters';
          break;
        case 'description':
          if (!value.trim()) error = 'Description is required';
          else if (value.trim().length < 30) error = 'Description must be at least 30 characters';
          break;
        case 'price':
          if (!value) error = 'Rent price is required';
          else if (Number(value) <= 0) error = 'Price must be greater than 0';
          break;
        case 'size':
          if (!value) error = 'Size is required';
          else if (Number(value) <= 10) error = 'Size must be greater than 10 sqft';
          break;
        case 'availability':
          if (!value) error = 'Availability date is required';
          break;
        case 'contactName':
          if (!value.trim()) error = 'Contact name is required';
          break;
        case 'contactWhatsapp':
          if (!value.trim()) error = 'WhatsApp number is required';
          else if (!phoneRegex.test(value.trim())) error = 'Enter a valid 10-digit WhatsApp number';
          break;
        case 'contactEmail':
          if (!value.trim()) error = 'Email is required';
          else if (!emailRegex.test(value.trim())) error = 'Enter a valid email address';
          break;
        case 'localityTags':
          if (!value || value.length === 0) error = 'At least one locality tag is required';
          break;
        case 'lat':
        case 'lng':
          if (!value) error = 'Please set a PIN on the map using live location or Google Maps link';
          break;
      }
    } else if (mode === 'requirement') {
      switch (name) {
        case 'name':
          if (!value.trim()) error = 'Name is required';
          break;
        case 'minBudget':
          if (!value) error = 'Min budget is required';
          else if (Number(value) <= 0) error = 'Min budget must be greater than 0';
          break;
        case 'maxBudget':
          if (!value) error = 'Max budget is required';
          else if (Number(value) < Number(requirement.minBudget)) error = 'Max budget cannot be less than Min budget';
          break;
        case 'moveInDate':
          if (!value) error = 'Move-in date is required';
          break;
        case 'whatsapp':
          if (!value.trim()) error = 'WhatsApp number is required';
          else if (!phoneRegex.test(value.trim())) error = 'Enter a valid 10-digit WhatsApp number';
          break;
        case 'email':
          if (!value.trim()) error = 'Email is required';
          else if (!emailRegex.test(value.trim())) error = 'Enter a valid email address';
          break;
      }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (mode === 'flat') {
      if (!property.title.trim() || property.title.trim().length < 10) newErrors.title = 'Title must be at least 10 characters';
      if (!property.description.trim() || property.description.trim().length < 30) newErrors.description = 'Description must be at least 30 characters';
      if (!property.price || Number(property.price) <= 0) newErrors.price = 'Valid rent price is required';
      if (!property.size || Number(property.size) <= 10) newErrors.size = 'Valid size is required';
      if (!property.bhk) newErrors.bhk = 'Please select BHK';
      if (!property.furnishing) newErrors.furnishing = 'Please select furnishing level';
      if (!property.availability) newErrors.availability = 'Availability date is required';
      if (!property.lat || !property.lng) newErrors.location = 'Please set property PIN';
      if (property.localityTags.length === 0) newErrors.localityTags = 'At least one locality tag is required';
      if (!property.contactName.trim()) newErrors.contactName = 'Contact name is required';
      if (!phoneRegex.test(property.contactWhatsapp.trim())) newErrors.contactWhatsapp = 'Valid 10-digit WhatsApp number required';
      if (!emailRegex.test(property.contactEmail.trim())) newErrors.contactEmail = 'Valid email address required';
    } else if (mode === 'requirement') {
      if (!requirement.name.trim()) newErrors.name = 'Name is required';
      if (!requirementOccupation) newErrors.occupation = 'Occupation is required';
      if (!requirement.minBudget || Number(requirement.minBudget) <= 0) newErrors.minBudget = 'Valid min budget required';
      if (!requirement.maxBudget || Number(requirement.maxBudget) < Number(requirement.minBudget)) newErrors.maxBudget = 'Max budget must be >= Min budget';
      if (!requirement.bhkPreference) newErrors.bhkPreference = 'Please select BHK preference';
      if (!requirement.moveInDate) newErrors.moveInDate = 'Move-in date is required';
      if (!phoneRegex.test(requirement.whatsapp.trim())) newErrors.whatsapp = 'Valid 10-digit WhatsApp number required';
      if (!emailRegex.test(requirement.email.trim())) newErrors.email = 'Valid email address required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }
    return isValid;
  };

  const heading = useMemo(() => {
    if (mode === 'flat') return 'List Flat';
    if (mode === 'requirement') return 'Add Requirement';
    return 'Add Listing';
  }, [mode]);

  const pickLiveLocation = async () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setProperty(prev => ({
          ...prev,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude)
        }));
      },
      err => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addFiles = async (files: FileList | null, kind: 'image' | 'video') => {
    if (!files || files.length === 0) return;
    setError(null);
    try {
      const isImage = kind === 'image';
      const maxCount = isImage ? 8 : 1;
      const maxBytes = isImage ? 1.5 * 1024 * 1024 : 30 * 1024 * 1024;
      const currentCount = isImage ? images.length : videos.length;
      const remaining = Math.max(0, maxCount - currentCount);
      const incoming = Array.from(files).slice(0, remaining);

      if (incoming.length < files.length) {
        setError(isImage ? 'Max 8 photos allowed.' : 'Max 1 video allowed.');
      }

      const oversize = incoming.find(f => f.size > maxBytes);
      if (oversize) {
        setError(isImage ? 'Each photo must be <= 1.5 MB.' : 'Video must be <= 30 MB.');
        return;
      }

      const next = await Promise.all(incoming.map(fileToDataUrl));
      if (isImage) setImages(prev => [...prev, ...next]);
      else setVideos(prev => [...prev, ...next]);
    } catch {
      setError('Failed to load media files.');
    }
  };

  const removeMedia = (kind: 'image' | 'video', idx: number) => {
    if (kind === 'image') setImages(prev => prev.filter((_, i) => i !== idx));
    else setVideos(prev => prev.filter((_, i) => i !== idx));
  };

  const requirementOccupation = useMemo(() => {
    if (requirement.occupationPreset === 'Custom') return requirement.occupationCustom.trim();
    return requirement.occupationPreset;
  }, [requirement.occupationCustom, requirement.occupationPreset]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!checkedContact) return false;
    if (mode === 'flat') {
      return Boolean(
        property.title.trim() &&
        property.description.trim() &&
        property.price &&
        property.bhk !== null &&
        property.size &&
        property.localityTags.length > 0 &&
        property.furnishing &&
        property.availability &&
        property.contactName.trim() &&
        property.contactWhatsapp.trim() &&
        property.contactEmail.trim() &&
        property.lat &&
        property.lng
      );
    }
    if (mode === 'requirement') {
      return Boolean(
        requirement.name.trim() &&
        requirementOccupation &&
        requirement.minBudget &&
        requirement.maxBudget &&
        requirement.bhkPreference !== null &&
        requirement.moveInDate &&
        requirement.whatsapp.trim()
      );
    }
    return false;
  }, [mode, property, requirement, requirementOccupation, submitting, checkedContact]);

  const submit = async () => {
    setError(null);
    if (!validateForm()) {
      setError('Please fix the errors in the form before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'flat') {
        const payload = {
          title: property.title.trim(),
          description: property.description.trim(),
          price: Number(property.price),
          deposit: property.deposit ? Number(property.deposit) : undefined,
          maintenance: property.maintenance ? Number(property.maintenance) : undefined,
          bhk: Number(property.bhk),
          size: Number(property.size),
          localityTags: property.localityTags,
          location: { type: 'Point', coordinates: [Number(property.lng), Number(property.lat)] },
          amenities: property.amenities,
          furnishing: property.furnishing,
          availability: new Date(property.availability),
          contact: {
            name: property.contactName.trim(),
            whatsapp: property.contactWhatsapp.trim(),
            email: property.contactEmail.trim()
          },
          petFriendly: property.petFriendly,
          femaleOnly: property.femaleOnly,
          parkingAvailable: property.parkingAvailable,
          images,
          videos
        };
        await createProperty(payload);
      } else if (mode === 'requirement') {
        const selectedAsType =
          requirement.bhkPreference === 'PG' || requirement.bhkPreference === 'Hostel' ? requirement.bhkPreference : null;

        const payload = {
          name: requirement.name.trim(),
          alias: requirementOccupation,
          budget: { min: Number(requirement.minBudget), max: Number(requirement.maxBudget) },
          bhkPreference: typeof requirement.bhkPreference === 'number' ? requirement.bhkPreference : undefined,
          preferredLocations: requirement.preferredLocations,
          moveInDate: new Date(requirement.moveInDate),
          genderPreference: requirement.genderPreference,
          propertyType: selectedAsType || 'Apartment',
          furnishingPreference: requirement.furnishingPreference || undefined,
          notes: requirement.notes.trim(),
          preferences: requirement.amenitiesPreference,
          contact: {
            whatsapp: normalizeWhatsApp(requirement.whatsapp),
            email: requirement.email.trim()
          }
        };
        await createFlatmateRequirement(payload);
      }
      setIsSuccess(true);
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const successContent = (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100">
        <CheckCircle className="w-12 h-12 text-emerald-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Listing Submitted!</h3>
        <p className="text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
          Now admin will approve your listing and will be live soon. Estimated time for approval: 12 hrs.
        </p>
      </div>
      <button
        onClick={close}
        className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
      >
        Great, Got it
      </button>
    </div>
  );
  const formContent = (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-700 font-bold">
          {error}
        </div>
      )}

      {mode === 'choose' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <button
            type="button"
            onClick={() => setMode('flat')}
            className="p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all text-left shadow-sm hover:shadow-xl"
          >
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Option A</div>
            <div className="mt-2 text-xl font-black text-slate-800 uppercase tracking-tight">List Flat</div>
            <div className="mt-3 text-sm text-slate-500 font-bold">Add a property listing with location, pricing, and media.</div>
          </button>

          <button
            type="button"
            onClick={() => setMode('requirement')}
            className="p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all text-left shadow-sm hover:shadow-xl"
          >
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Option B</div>
            <div className="mt-2 text-xl font-black text-slate-800 uppercase tracking-tight">Add Requirement</div>
            <div className="mt-3 text-sm text-slate-500 font-bold">Add what you need + preferences so others can match.</div>
          </button>
        </div>
      )}

      {mode === 'flat' && (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Basics</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Title *</div>
                <input
                  value={property.title}
                  onChange={e => {
                    setProperty(p => ({ ...p, title: e.target.value }));
                    if (errors.title) validateField('title', e.target.value, mode);
                  }}
                  onBlur={e => validateField('title', e.target.value, mode)}
                  placeholder="Title"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.title ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.title && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.title}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Rent price *</div>
                <input
                  value={property.price}
                  onChange={e => {
                    setProperty(p => ({ ...p, price: e.target.value }));
                    if (errors.price) validateField('price', e.target.value, mode);
                  }}
                  onBlur={e => validateField('price', e.target.value, mode)}
                  placeholder="Price (monthly rent)"
                  type="number"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.price ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.price && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.price}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Size (sqft) *</div>
                <input
                  value={property.size}
                  onChange={e => {
                    setProperty(p => ({ ...p, size: e.target.value }));
                    if (errors.size) validateField('size', e.target.value, mode);
                  }}
                  onBlur={e => validateField('size', e.target.value, mode)}
                  placeholder="Size (sqft)"
                  type="number"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.size ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.size && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.size}</div>}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">BHK preference *</div>
              <div className="flex flex-wrap gap-2">
                {CHIP_PRESETS.bhk.filter(opt => typeof opt.value === 'number').map(opt => (
                  <Chip
                    key={opt.label}
                    label={opt.label}
                    selected={property.bhk === opt.value}
                    onClick={() => {
                      const next = property.bhk === opt.value ? null : (opt.value as number);
                      setProperty(p => ({ ...p, bhk: next }));
                      if (errors.bhk) setErrors(prev => ({ ...prev, bhk: '' }));
                    }}
                  />
                ))}
              </div>
              {errors.bhk && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.bhk}</div>}
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Description *</div>
              <textarea
                value={property.description}
                onChange={e => {
                  setProperty(p => ({ ...p, description: e.target.value }));
                  if (errors.description) validateField('description', e.target.value, mode);
                }}
                onBlur={e => validateField('description', e.target.value, mode)}
                placeholder="Description"
                className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all min-h-[110px] ${errors.description ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
              />
              {errors.description && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.description}</div>}
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Furnishing *</div>
            <div className="flex flex-wrap gap-2">
              {(['unfurnished', 'semi-furnished', 'fully-furnished'] as const).map(opt => (
                <Chip
                  key={opt}
                  label={opt.replace('-', ' ')}
                  selected={property.furnishing === opt}
                  onClick={() => {
                    const next = property.furnishing === opt ? '' : opt;
                    setProperty(p => ({ ...p, furnishing: next }));
                    if (errors.furnishing) setErrors(prev => ({ ...prev, furnishing: '' }));
                  }}
                />
              ))}
            </div>
            {errors.furnishing && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.furnishing}</div>}
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Availability & Charges</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Available from *</div>
                <input
                  value={property.availability}
                  onChange={e => {
                    setProperty(p => ({ ...p, availability: e.target.value }));
                    if (errors.availability) validateField('availability', e.target.value, mode);
                  }}
                  onBlur={e => validateField('availability', e.target.value, mode)}
                  type="date"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.availability ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.availability && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.availability}</div>}
              </div>
              <input
                value={property.deposit}
                onChange={e => setProperty(p => ({ ...p, deposit: e.target.value }))}
                placeholder="Deposit"
                type="number"
                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all"
              />
              <input
                value={property.maintenance}
                onChange={e => setProperty(p => ({ ...p, maintenance: e.target.value }))}
                placeholder="Maintenance"
                type="number"
                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Location *</div>
              <button
                type="button"
                onClick={pickLiveLocation}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-colors"
              >
                <MapPin className="w-4 h-4" /> Use Live Location for PIN
              </button>
            </div>
            {errors.location && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1 mb-2">{errors.location}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={property.googlePinLink}
                onChange={e => setProperty(p => ({ ...p, googlePinLink: e.target.value }))}
                placeholder="Google Maps link (optional)"
                className="sm:col-span-2 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = parseLatLngFromGoogleMapsLink(property.googlePinLink);
                  if (!parsed) {
                    setError('Could not extract coordinates from the Google Maps link.');
                    return;
                  }
                  setError(null);
                  setProperty(p => ({ ...p, lat: String(parsed.lat), lng: String(parsed.lng) }));
                }}
                className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-colors"
              >
                Add pin
              </button>
            </div>
            {property.lat && property.lng && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-xs font-bold"
                onLoad={() => { if (errors.location) setErrors(prev => ({ ...prev, location: '' })); }}>
                <MapPin className="w-4 h-4" />
                PIN set — {parseFloat(property.lat).toFixed(5)}, {parseFloat(property.lng).toFixed(5)}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Location tags *</div>
            <ChipInput
              value={property.localityTags}
              onChange={next => {
                setProperty(p => ({ ...p, localityTags: next }));
                if (errors.localityTags) validateField('localityTags', next, mode);
              }}
              placeholder="Add area / sector / landmark (press Enter)"
            />
            {errors.localityTags && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.localityTags}</div>}
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Amenities</div>
            <div className="flex flex-wrap gap-2">
              {CHIP_PRESETS.amenities.map(a => (
                <Chip
                  key={a}
                  label={a}
                  selected={property.amenities.includes(a)}
                  onClick={() =>
                    setProperty(p => ({
                      ...p,
                      amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a]
                    }))
                  }
                />
              ))}
            </div>
            <ChipInput value={property.amenities} onChange={next => setProperty(p => ({ ...p, amenities: next }))} placeholder="Add custom amenity (press Enter)" />
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Rules</div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setProperty(p => ({ ...p, petFriendly: !p.petFriendly }))}
                className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${property.petFriendly ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-3xl transition-all ${property.petFriendly ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                    <Dog className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-black uppercase tracking-tight ${property.petFriendly ? 'text-indigo-800' : 'text-slate-800'}`}>Pet Friendly</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Allow household pets</div>
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full relative transition-all ${property.petFriendly ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${property.petFriendly ? 'left-[1.8rem]' : 'left-1.5'}`} />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProperty(p => ({ ...p, femaleOnly: !p.femaleOnly }))}
                className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${property.femaleOnly ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-3xl transition-all ${property.femaleOnly ? 'bg-pink-500 text-white scale-110 shadow-lg border border-pink-400' : 'bg-slate-200 text-slate-500'}`}>
                    <Shield className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-black uppercase tracking-tight ${property.femaleOnly ? 'text-pink-700' : 'text-slate-800'}`}>Female Only</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Properties exclusive to women</div>
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full relative transition-all ${property.femaleOnly ? 'bg-pink-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${property.femaleOnly ? 'left-[1.8rem]' : 'left-1.5'}`} />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProperty(p => ({ ...p, parkingAvailable: !p.parkingAvailable }))}
                className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${property.parkingAvailable ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-3xl transition-all ${property.parkingAvailable ? 'bg-emerald-600 text-white scale-110 shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-black uppercase tracking-tight ${property.parkingAvailable ? 'text-emerald-800' : 'text-slate-800'}`}>Parking Available</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Dedicated parking spot included</div>
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full relative transition-all ${property.parkingAvailable ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${property.parkingAvailable ? 'left-[1.8rem]' : 'left-1.5'}`} />
                </div>
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Contact *</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Name *</div>
                <input
                  value={property.contactName}
                  onChange={e => {
                    setProperty(p => ({ ...p, contactName: e.target.value }));
                    if (errors.contactName) validateField('contactName', e.target.value, mode);
                  }}
                  onBlur={e => validateField('contactName', e.target.value, mode)}
                  placeholder="Name"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.contactName ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.contactName && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.contactName}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">WhatsApp Number *</div>
                <input
                  value={property.contactWhatsapp}
                  onChange={e => {
                    setProperty(p => ({ ...p, contactWhatsapp: e.target.value }));
                    if (errors.contactWhatsapp) validateField('contactWhatsapp', e.target.value, mode);
                  }}
                  onBlur={e => validateField('contactWhatsapp', e.target.value, mode)}
                  placeholder="WhatsApp Number"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.contactWhatsapp ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.contactWhatsapp && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.contactWhatsapp}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Email *</div>
                <input
                  value={property.contactEmail}
                  onChange={e => {
                    setProperty(p => ({ ...p, contactEmail: e.target.value }));
                    if (errors.contactEmail) validateField('contactEmail', e.target.value, mode);
                  }}
                  onBlur={e => validateField('contactEmail', e.target.value, mode)}
                  placeholder="Email"
                  type="email"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.contactEmail ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.contactEmail && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.contactEmail}</div>}
              </div>
            </div>
            <div
              onClick={() => setCheckedContact(!checkedContact)}
              className="mt-6 flex items-start gap-3 cursor-pointer group bg-slate-50/50 p-4 rounded-2xl border-2 border-transparent hover:border-slate-100 transition-all"
            >
              <div className={`mt-0.5 transition-colors ${checkedContact ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                {checkedContact ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                We connect interested people directly with you, so please provide a correct contact number so they can reach you.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Media</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Optional • Max 8 photos (≤ 1.5MB each) • Max 1 video (≤ 30MB)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => fileInputImagesRef.current?.click()}
                disabled={images.length >= 8}
                className="p-4 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all text-left"
              >
                <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-xs">
                  <ImageIcon className="w-4 h-4 text-indigo-600" /> Add photos
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">From device</div>
              </button>
              <button
                type="button"
                onClick={() => fileInputCameraImageRef.current?.click()}
                disabled={images.length >= 8}
                className="p-4 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all text-left"
              >
                <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-xs">
                  <Camera className="w-4 h-4 text-indigo-600" /> Camera
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Capture photo</div>
              </button>
              <button
                type="button"
                onClick={() => fileInputVideosRef.current?.click()}
                disabled={videos.length >= 1}
                className="p-4 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all text-left"
              >
                <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-xs">
                  <Video className="w-4 h-4 text-indigo-600" /> Add video
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">From device/camera</div>
              </button>
            </div>

            <input
              ref={fileInputImagesRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => addFiles(e.target.files, 'image')}
            />
            <input
              ref={fileInputCameraImageRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => addFiles(e.target.files, 'image')}
            />
            <input
              ref={fileInputVideosRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={e => addFiles(e.target.files, 'video')}
            />

            {(images.length > 0 || videos.length > 0) && (
              <div className="space-y-4">
                {images.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Images ({images.length})
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {images.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => removeMedia('image', i)}
                          className="relative rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-rose-200 transition-all group"
                          title="Click to remove"
                        >
                          <img src={src} alt="" className="w-full h-24 object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                          <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4 text-slate-900" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {videos.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                      <Video className="w-4 h-4" /> Videos ({videos.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {videos.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => removeMedia('video', i)}
                          className="relative rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-rose-200 transition-all group text-left"
                          title="Click to remove"
                        >
                          <video src={src} className="w-full h-28 object-cover" controls />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {mode === 'requirement' && (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Occupation *</div>
            <div className="flex flex-wrap gap-2">
              {CHIP_PRESETS.occupations.map(o => (
                <Chip
                  key={o}
                  label={o}
                  selected={requirement.occupationPreset === o}
                  onClick={() => {
                    const next = requirement.occupationPreset === o ? '' : (o as any);
                    setRequirement(r => ({ ...r, occupationPreset: next }));
                    if (errors.occupation) setErrors(prev => ({ ...prev, occupation: '' }));
                  }}
                />
              ))}
              <Chip
                label="Custom"
                selected={requirement.occupationPreset === 'Custom'}
                onClick={() => {
                  const next = requirement.occupationPreset === 'Custom' ? '' : 'Custom';
                  setRequirement(r => ({ ...r, occupationPreset: next }));
                  if (errors.occupation) setErrors(prev => ({ ...prev, occupation: '' }));
                }}
              />
            </div>
            {errors.occupation && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.occupation}</div>}
            {requirement.occupationPreset === 'Custom' && (
              <input
                value={requirement.occupationCustom}
                onChange={e => setRequirement(r => ({ ...r, occupationCustom: e.target.value }))}
                placeholder="Type your occupation"
                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all"
              />
            )}
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Basics</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Name *</div>
                <input
                  value={requirement.name}
                  onChange={e => {
                    setRequirement(r => ({ ...r, name: e.target.value }));
                    if (errors.name) validateField('name', e.target.value, mode);
                  }}
                  onBlur={e => validateField('name', e.target.value, mode)}
                  placeholder="Name"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.name ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.name && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.name}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Move-in Date *</div>
                <input
                  value={requirement.moveInDate}
                  onChange={e => {
                    setRequirement(r => ({ ...r, moveInDate: e.target.value }));
                    if (errors.moveInDate) validateField('moveInDate', e.target.value, mode);
                  }}
                  onBlur={e => validateField('moveInDate', e.target.value, mode)}
                  type="date"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.moveInDate ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.moveInDate && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.moveInDate}</div>}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">BHK preference *</div>
              <div className="flex flex-wrap gap-2">
                {CHIP_PRESETS.bhk.map(opt => (
                  <Chip
                    key={opt.label}
                    label={opt.label}
                    selected={requirement.bhkPreference === opt.value}
                    onClick={() => {
                      const next = requirement.bhkPreference === opt.value ? null : opt.value;
                      setRequirement(r => ({ ...r, bhkPreference: next }));
                      if (errors.bhkPreference) setErrors(prev => ({ ...prev, bhkPreference: '' }));
                    }}
                  />
                ))}
              </div>
              {errors.bhkPreference && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.bhkPreference}</div>}
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Rent budget *</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={requirement.minBudget}
                onChange={e => {
                  setRequirement(r => ({ ...r, minBudget: e.target.value }));
                  if (errors.minBudget) validateField('minBudget', e.target.value, mode);
                }}
                onBlur={e => validateField('minBudget', e.target.value, mode)}
                placeholder="Min rent budget"
                type="number"
                className={`flex-1 bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.minBudget ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
              />
              <input
                value={requirement.maxBudget}
                onChange={e => {
                  setRequirement(r => ({ ...r, maxBudget: e.target.value }));
                  if (errors.maxBudget) validateField('maxBudget', e.target.value, mode);
                }}
                onBlur={e => validateField('maxBudget', e.target.value, mode)}
                placeholder="Max rent budget"
                type="number"
                className={`flex-1 bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.maxBudget ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
              />
            </div>
            {(errors.minBudget || errors.maxBudget) && (
              <div className="flex flex-col gap-1 px-1">
                {errors.minBudget && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">{errors.minBudget}</div>}
                {errors.maxBudget && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">{errors.maxBudget}</div>}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Preferred locations</div>
            <ChipInput value={requirement.preferredLocations} onChange={next => setRequirement(r => ({ ...r, preferredLocations: next }))} placeholder="Add location (press Enter)" />
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gender preference</div>
            <div className="flex flex-wrap gap-2">
              {(['Any', 'Male', 'Female'] as const).map(g => (
                <Chip
                  key={g}
                  label={g}
                  selected={requirement.genderPreference === g}
                  onClick={() => setRequirement(r => ({ ...r, genderPreference: g }))}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Furnishing preference</div>
            <div className="flex flex-wrap gap-2">
              {(['unfurnished', 'semi-furnished', 'fully-furnished'] as const).map(opt => (
                <Chip
                  key={opt}
                  label={opt.replace('-', ' ')}
                  selected={requirement.furnishingPreference === opt}
                  onClick={() => setRequirement(r => ({ ...r, furnishingPreference: r.furnishingPreference === opt ? '' : opt }))}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Amenities preference</div>
            <div className="flex flex-wrap gap-2">
              {CHIP_PRESETS.amenities.map(a => (
                <Chip
                  key={a}
                  label={a}
                  selected={requirement.amenitiesPreference.includes(a)}
                  onClick={() =>
                    setRequirement(r => ({
                      ...r,
                      amenitiesPreference: r.amenitiesPreference.includes(a)
                        ? r.amenitiesPreference.filter(x => x !== a)
                        : [...r.amenitiesPreference, a]
                    }))
                  }
                />
              ))}
            </div>
            <ChipInput
              value={requirement.amenitiesPreference}
              onChange={next => setRequirement(r => ({ ...r, amenitiesPreference: next }))}
              placeholder="Add custom amenity preference (press Enter)"
            />
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Notes</div>
            <textarea
              value={requirement.notes}
              onChange={e => setRequirement(r => ({ ...r, notes: e.target.value }))}
              placeholder="Anything else?"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all min-h-[110px]"
            />
          </section>

          <section className="space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Contact *</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">WhatsApp Number *</div>
                <input
                  value={requirement.whatsapp}
                  onChange={e => {
                    setRequirement(r => ({ ...r, whatsapp: e.target.value }));
                    if (errors.whatsapp) validateField('whatsapp', e.target.value, mode);
                  }}
                  onBlur={e => validateField('whatsapp', e.target.value, mode)}
                  placeholder="WhatsApp Number"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.whatsapp ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.whatsapp && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.whatsapp}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Email *</div>
                <input
                  value={requirement.email}
                  onChange={e => {
                    setRequirement(r => ({ ...r, email: e.target.value }));
                    if (errors.email) validateField('email', e.target.value, mode);
                  }}
                  onBlur={e => validateField('email', e.target.value, mode)}
                  placeholder="Email"
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all ${errors.email ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {errors.email && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.email}</div>}
              </div>
            </div>
            <div
              onClick={() => setCheckedContact(!checkedContact)}
              className="mt-6 flex items-start gap-3 cursor-pointer group bg-slate-50/50 p-4 rounded-2xl border-2 border-transparent hover:border-slate-100 transition-all"
            >
              <div className={`mt-0.5 transition-colors ${checkedContact ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                {checkedContact ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                We connect interested people directly with you, so please provide a correct contact number so they can reach you.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[90] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Create</div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{heading}</h2>
              </div>
              <div className="flex items-center gap-2">
                {mode !== 'choose' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('choose');
                    }}
                    className="px-4 py-3 rounded-2xl bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button onClick={close} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto font-sans flex-1 custom-scrollbar">
              {isSuccess ? successContent : formContent}
            </div>

            {!isSuccess && (
              <div className="p-5 sm:p-8 border-t bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] text-center sm:text-left">
                  {mode === 'flat' ? `${images.length} images • ${videos.length} videos` : mode === 'requirement' ? 'Requirement will be published' : 'Choose an option'}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                  {mode !== 'choose' && (
                    <div
                      onClick={() => setCheckedLimit(!checkedLimit)}
                      className="flex items-center gap-2 cursor-pointer group sm:pr-2 justify-center sm:justify-start"
                    >
                      <div className={`transition-colors ${checkedLimit ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                        {checkedLimit ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Max 2 active listings per contact
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={close}
                      className="flex-1 sm:flex-none px-6 py-4 font-black text-[12px] text-slate-400 hover:text-slate-800 uppercase tracking-[0.3em] transition-colors border-2 border-slate-200 rounded-[1.8rem] hover:border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={submit}
                      className={`flex-1 sm:flex-none px-8 py-4 rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all ${canSubmit ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 active:scale-95' : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                        }`}
                    >
                      {submitting ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

