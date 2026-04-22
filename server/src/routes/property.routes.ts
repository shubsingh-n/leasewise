import { Router } from 'express';
import { createProperty, getProperties, getPropertyById } from '../controllers/property.controller';

const router = Router();

router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.post('/', createProperty);

export default router;
