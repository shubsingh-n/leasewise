import mongoose, { Schema, Document } from 'mongoose';

export interface IContactRequest extends Document {
  requesterName: string;
  requesterPhone: string;
  listingId: string;
  listingType: 'Property' | 'Flatmate';
  listingTitle: string;
  ownerPhone: string;
  ownerName: string;
  status: 'pending' | 'notified' | 'completed';
  createdAt: Date;
}

const ContactRequestSchema: Schema = new Schema({
  requesterName: { type: String, required: true },
  requesterPhone: { type: String, required: true },
  listingId: { type: String, required: true },
  listingType: { 
    type: String, 
    enum: ['Property', 'Flatmate'], 
    required: true 
  },
  listingTitle: { type: String, required: true },
  ownerPhone: { type: String, required: true },
  ownerName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'notified', 'completed'], 
    default: 'pending' 
  }
}, { timestamps: true });

export default mongoose.model<IContactRequest>('ContactRequest', ContactRequestSchema);
