import express from 'express';
import { createRequirement, getRequirements, getRequirementById } from '../controllers/flatmate.controller';

const router = express.Router();

router.get('/', getRequirements);
router.get('/:id', getRequirementById);
router.post('/', createRequirement);

export default router;
