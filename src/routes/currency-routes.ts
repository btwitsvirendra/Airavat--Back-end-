import { Router } from 'express';
import {
  getAllCurrencies,
  getCurrencyById,
  getCurrencyByCode,
  createCurrency,
  updateCurrency,
  deleteCurrency,
} from '../controllers/currency-controller';
import { authenticateToken, isAdmin } from '../middlewares/auth-middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/', getAllCurrencies);
router.get('/code/:code', getCurrencyByCode);
router.get('/:id', getCurrencyById);

// Protected routes (authentication required)
router.post('/', authenticateToken, isAdmin, createCurrency);
router.put('/:id', authenticateToken, isAdmin, updateCurrency);
router.delete('/:id', authenticateToken, isAdmin, deleteCurrency);

export default router;
