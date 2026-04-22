import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  price: number;
  deposit: number;
  maintenance: number;
  bhk: number;
  size: number;
  localityTags?: string[];
  location: {
    type: string;
    coordinates: number[]; // [lng, lat]
  };
  amenities: string[];
  furnishing: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  availability: Date;
  contact: {
    name: string;
    whatsapp: string;
    email: string;
  };
  petFriendly: boolean;
  femaleOnly: boolean;
  parkingAvailable?: boolean;
  images: string[];
  videos?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  expiresAt?: Date;
  lastNotifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

const PropertySchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  deposit: { type: Number },
  maintenance: { type: Number },
  bhk: { type: Number, required: true },
  size: { type: Number, required: true },
  localityTags: [{ type: String }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  amenities: [{ type: String }],
  furnishing: {
    type: String,
    enum: ['unfurnished', 'semi-furnished', 'fully-furnished'],
    required: true
  },
  availability: { type: Date, required: true },
  contact: {
    name: { type: String, required: true },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true }
  },
  petFriendly: { type: Boolean, default: false },
  femaleOnly: { type: Boolean, default: false },
  parkingAvailable: { type: Boolean, default: false },
  images: [{ type: String }],
  videos: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled'],
    default: 'pending'
  },
  expiresAt: { type: Date },
  lastNotifiedAt: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

PropertySchema.index({ location: '2dsphere' });

export default mongoose.model<IProperty>('Property', PropertySchema);
