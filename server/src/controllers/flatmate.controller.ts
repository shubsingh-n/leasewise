import express from 'express';
import FlatmateRequirement from '../models/FlatmateRequirement';

export const getRequirements = async (req: express.Request, res: express.Response) => {
  try {
    const { 
      minBudget, maxBudget, 
      location, 
      moveInDate,
      genderPreference,
      propertyType,
      furnishingPreference,
      bhkPreference,
      page = 1,
      limit = 10
    } = req.query;

    let query: any = { status: 'approved' };

    if (minBudget || maxBudget) {
      query['budget.min'] = {};
      query['budget.max'] = {};
      // For a user with max Budget, they can afford properties up to their max
      if (maxBudget) {
        query['budget.min'].$lte = Number(maxBudget);
      }
      if (minBudget) {
        query['budget.max'].$gte = Number(minBudget);
      }
      // Clean up empty objects
      if (Object.keys(query['budget.min']).length === 0) delete query['budget.min'];
      if (Object.keys(query['budget.max']).length === 0) delete query['budget.max'];
    }

    if (location) {
      // Basic text search over preferred locations
      query.preferredLocations = { $regex: location as string, $options: 'i' };
    }

    if (moveInDate) {
      // Find requirements where move in date is somewhat close or greater
      query.moveInDate = { $gte: new Date(moveInDate as string) };
    }

    if (genderPreference && genderPreference !== 'Any') {
      query.genderPreference = genderPreference;
    }

    if (propertyType) {
      query.propertyType = propertyType;
    }

    if (furnishingPreference) {
      query.furnishingPreference = furnishingPreference;
    }

    if (bhkPreference) {
      query.bhkPreference = Number(bhkPreference);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skipNum = (pageNum - 1) * limitNum;

    const requirements = await FlatmateRequirement.find(query)
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);
      
    const total = await FlatmateRequirement.countDocuments(query);

    res.json({
      data: requirements,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRequirementById = async (req: express.Request, res: express.Response) => {
  try {
    const requirement = await FlatmateRequirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ message: 'Requirement not found' });
    res.json(requirement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRequirement = async (req: express.Request, res: express.Response) => {
  try {
    const created = await FlatmateRequirement.create(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
