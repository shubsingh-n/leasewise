import mongoose from 'mongoose';
import Property from '../models/Property';
import FlatmateRequirement from '../models/FlatmateRequirement';
import dotenv from 'dotenv';

dotenv.config();

const properties = [
  {
    title: "Luxury 4BHK Female-Only Penthouse",
    description: "Premium high-rise apartment exclusively for females with stunning views. Fully furnished and pet friendly.",
    price: 90000,
    deposit: 180000,
    maintenance: 8000,
    bhk: 4,
    size: 3200,
    location: { type: "Point", coordinates: [77.0888, 28.4950] }, // Cyber City
    amenities: ["Gym", "Swimming Pool", "Clubhouse", "Security", "Parking"],
    furnishing: "fully-furnished",
    availability: new Date('2026-04-10'), // already available
    petFriendly: true,
    femaleOnly: true,
    contact: { name: "Aisha Khan", whatsapp: "+91 9123456780", email: "aisha@ncr-rentals.com" },
    images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00", "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd"]
  },
  {
    title: "1RK Studio for Bachelors in Sector 18",
    description: "Compact unfurnished studio, very budget friendly. No pets allowed.",
    price: 12000,
    deposit: 24000,
    maintenance: 1000,
    bhk: 0.5,
    size: 350,
    location: { type: "Point", coordinates: [77.3275, 28.5672] }, // Noida
    amenities: ["Security", "WiFi"],
    furnishing: "unfurnished",
    availability: new Date('2026-05-20'), // available later
    petFriendly: false,
    femaleOnly: false,
    contact: { name: "Rahul Gupta", whatsapp: "+91 9123456781", email: "rahul@ncr-rentals.com" },
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"]
  },
  {
    title: "2BHK Pet-Friendly Semi-Furnished",
    description: "Spacious 2BHK perfect for pet lovers. Equipped with basic furniture.",
    price: 32000,
    deposit: 64000,
    maintenance: 3000,
    bhk: 2,
    size: 1100,
    location: { type: "Point", coordinates: [77.3712, 28.6360] }, // Indirapuram
    amenities: ["Lift", "Security", "Parking"],
    furnishing: "semi-furnished",
    availability: new Date('2026-04-15'), // almost available
    petFriendly: true,
    femaleOnly: false,
    contact: { name: "Vikram Singh", whatsapp: "+91 9123456782", email: "vikram@ncr-rentals.com" },
    images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858"]
  },
  {
    title: "Exclusive 3BHK Female-Only in Connaught Place",
    description: "Semi-furnished colonial architecture. Very safe, strictly for females. No pets.",
    price: 75000,
    deposit: 200000,
    maintenance: 5000,
    bhk: 3,
    size: 2100,
    location: { type: "Point", coordinates: [77.2197, 28.6327] }, // CP
    amenities: ["Terrace", "Security", "WiFi"],
    furnishing: "semi-furnished",
    availability: new Date('2026-05-01'),
    petFriendly: false,
    femaleOnly: true,
    contact: { name: "Simran Kaur", whatsapp: "+91 9123456783", email: "simran@ncr-rentals.com" },
    images: ["https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd"]
  },
  {
    title: "1BHK Independent Floor fully-furnished",
    description: "Quiet and peaceful independent standard 1BHK. Ideal for small family. Not for pets.",
    price: 22000,
    deposit: 50000,
    maintenance: 1500,
    bhk: 1,
    size: 700,
    location: { type: "Point", coordinates: [77.3100, 28.4000] }, // Faridabad
    amenities: ["Parking", "Garden"],
    furnishing: "fully-furnished",
    availability: new Date('2026-06-01'), // future
    petFriendly: false,
    femaleOnly: false,
    contact: { name: "Rajesh Malhotra", whatsapp: "+91 9123456784", email: "rajesh@ncr-rentals.com" },
    images: ["https://images.unsplash.com/photo-1513694203232-719a280e022f"]
  },
  {
    title: "Budget 2BHK Unfurnished",
    description: "Highly affordable unfurnished 2BHK. Extremely pet friendly society. Open for all.",
    price: 16000,
    deposit: 30000,
    maintenance: 1000,
    bhk: 2,
    size: 900,
    location: { type: "Point", coordinates: [77.4820, 28.4744] }, // Greater Noida
    amenities: ["Power Backup", "Security"],
    furnishing: "unfurnished",
    availability: new Date('2026-04-01'), // already available
    petFriendly: true,
    femaleOnly: false,
    contact: { name: "Deepak Tyagi", whatsapp: "+91 9123456785", email: "deepak@ncr-rentals.com" },
    images: ["https://images.unsplash.com/photo-1560448204-61dc36dc98c8"]
  }
];

const flatmates = [
  {
    name: "Ravi Kumar",
    alias: "Tech Bro",
    budget: { min: 10000, max: 20000 },
    preferredLocations: ["Cyber City", "DLF Phase 3"],
    moveInDate: new Date('2026-05-01'),
    genderPreference: "Male",
    propertyType: "Apartment",
    notes: "I am a software engineer working hybrid. Prefer a quiet place.",
    preferences: ["Non-smoker", "No late parties"],
    contact: { whatsapp: "+91 9988776655", email: "ravi@example.com" }
  },
  {
    name: "Priya Sharma",
    alias: "Designer",
    budget: { min: 15000, max: 30000 },
    preferredLocations: ["Connaught Place", "South Ex"],
    moveInDate: new Date('2026-04-20'),
    genderPreference: "Female",
    propertyType: "Independent House",
    notes: "Looking for an attached washroom. Love pets!",
    preferences: ["Pet Friendly", "Veg Only"],
    contact: { whatsapp: "+91 9988776656", email: "priya@example.com" }
  },
  {
    name: "Aman Gupta",
    alias: "Student",
    budget: { min: 5000, max: 12000 },
    preferredLocations: ["Greater Noida", "Knowledge Park"],
    moveInDate: new Date('2026-06-01'),
    genderPreference: "Any",
    propertyType: "Apartment",
    notes: "College student looking for budget sharing.",
    preferences: ["Chill with anything"],
    contact: { whatsapp: "+91 9988776657", email: "aman@example.com" }
  }
];

const seedDB = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: Seed script must not be run in production environment! This script drops collections.');
    }
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/map_rentals';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for final NCR seeding');

    await Property.deleteMany({});
    await FlatmateRequirement.deleteMany({});

    await Property.insertMany(properties);
    await FlatmateRequirement.insertMany(flatmates);

    console.log('Database seeded successfully with properties and flatmates.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
