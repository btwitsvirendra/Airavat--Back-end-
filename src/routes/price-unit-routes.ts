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

router.use(authenticateToken, isAdmin);

// Public routes
router.get('/', getAllPriceUnits);
router.get('/type/:type', getPriceUnitsByType);
router.get('/:id', getPriceUnitById);
router.get('/code/:code', getPriceUnitByCode);

// Admin routes
router.post('/', authenticateToken, isAdmin, createPriceUnit);
router.put('/:id', authenticateToken, isAdmin, updatePriceUnit);
router.delete('/:id', authenticateToken, isAdmin, deletePriceUnit);

export default router;
