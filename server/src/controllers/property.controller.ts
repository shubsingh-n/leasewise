import express from 'express';
import Property from '../models/Property';

export const getProperties = async (req: express.Request, res: express.Response) => {
  try {
    const { 
      minPrice, maxPrice, 
      bhk, 
      furnishing, 
      amenities,
      petFriendly,
      femaleOnly,
      availableFrom,
      bounds // Expecting [[sw_lng, sw_lat], [ne_lng, ne_lat]]
    } = req.query;

    let query: any = { status: 'approved' };

    // Bounds filtering
    if (bounds) {
      const b = JSON.parse(bounds as string);
      query.location = {
        $geoWithin: {
          $box: b
        }
      };
    }

    // Custom Polygon filtering (for Drawing Tool)
    if (req.query.polygon) {
      const polygon = JSON.parse(req.query.polygon as string);
      query.location = {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [polygon]
          }
        }
      };
    }

    // Range filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Exact match filtering
    if (bhk) {
      query.bhk = Number(bhk);
    }

    if (furnishing) {
      query.furnishing = furnishing;
    }

    if (amenities) {
      const ams = (amenities as string).split(',');
      query.amenities = { $all: ams };
    }

    if (petFriendly === 'true') {
      query.petFriendly = true;
    }

    if (femaleOnly === 'true') {
      query.femaleOnly = true;
    }

    if (availableFrom) {
      query.availability = { $lte: new Date(availableFrom as string) };
    }

    const properties = await Property.find(query);
    res.json(properties);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPropertyById = async (req: express.Request, res: express.Response) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProperty = async (req: express.Request, res: express.Response) => {
  try {
    const created = await Property.create(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
