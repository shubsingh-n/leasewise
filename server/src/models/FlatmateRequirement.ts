import mongoose, { Schema, Document } from 'mongoose';

export interface IFlatmateRequirement extends Document {
  name: string;
  alias: string;
  budget: {
    min: number;
    max: number;
  };
  bhkPreference?: number;
  preferredLocations: string[];
  moveInDate: Date;
  genderPreference: 'Any' | 'Male' | 'Female';
  propertyType: string;
  furnishingPreference?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  notes: string;
  preferences: string[];
  contact: {
    whatsapp: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  expiresAt?: Date;
  lastNotifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

const FlatmateRequirementSchema: Schema = new Schema({
  name: { type: String, required: true },
  alias: { type: String },
  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  bhkPreference: { type: Number },
  preferredLocations: [{ type: String }],
  moveInDate: { type: Date, required: true },
  genderPreference: {
    type: String,
    enum: ['Any', 'Male', 'Female'],
    default: 'Any'
  },
  propertyType: { type: String, default: 'Apartment' },
  furnishingPreference: {
    type: String,
    enum: ['unfurnished', 'semi-furnished', 'fully-furnished']
  },
  notes: { type: String },
  preferences: [{ type: String }],
  contact: {
    whatsapp: { type: String, required: true },
    email: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled'],
    default: 'pending'
  },
  expiresAt: { type: Date },
  lastNotifiedAt: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true, collection: 'flatmate_requirements' });

export default mongoose.model<IFlatmateRequirement>('FlatmateRequirement', FlatmateRequirementSchema);
