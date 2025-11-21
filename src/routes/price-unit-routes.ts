import { Router } from 'express';
import {
  getAllPriceUnits,
  getPriceUnitsByType,
  getPriceUnitById,
  getPriceUnitByCode,
  createPriceUnit,
  updatePriceUnit,
  deletePriceUnit,
} from '../controllers/price-unit-controller';
import { authenticateToken, isAdmin } from '../middlewares/auth-middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/', getAllPriceUnits);
router.get('/type/:type', getPriceUnitsByType);
router.get('/code/:code', getPriceUnitByCode);
router.get('/:id', getPriceUnitById);

// Protected routes (authentication required)
router.post('/', authenticateToken, isAdmin, createPriceUnit);
router.put('/:id', authenticateToken, isAdmin, updatePriceUnit);
router.delete('/:id', authenticateToken, isAdmin, deletePriceUnit);

export default router;
