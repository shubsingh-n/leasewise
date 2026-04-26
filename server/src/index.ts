import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import propertyRoutes from './routes/property.routes';
import flatmateRoutes from './routes/flatmate.routes';
import adminRoutes from './routes/admin.routes';
import contactRoutes from './routes/contact.routes';
import { initExpirationCron } from './services/expiration.service';

dotenv.config();

// Initialize services
initExpirationCron();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/map_rentals';

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Middleware to ensure DB connection for serverless
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/flatmates', flatmateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
