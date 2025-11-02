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

router.use(authenticateToken, isAdmin);

// Public routes
router.get('/', getAllCurrencies);
router.get('/:id', getCurrencyById);
router.get('/code/:code', getCurrencyByCode);

// Admin routes
router.post('/', authenticateToken, isAdmin, createCurrency);
router.put('/:id', authenticateToken, isAdmin, updateCurrency);
router.delete('/:id', authenticateToken, isAdmin, deleteCurrency);

export default router;
