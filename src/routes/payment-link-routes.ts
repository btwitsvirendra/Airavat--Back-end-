import { Router } from 'express';
import {
  createPaymentLink,
  getPaymentLinkByCode,
  getSellerPaymentLinks,
  updatePaymentLinkStatus,
  addPaymentLinkToCart,
} from '../controllers/payment-link-controller';
import { authenticateToken } from '../middlewares/auth-middleware';

const router = Router();

// Public route - get payment link by code (for buyers)
router.get('/code/:link_code', getPaymentLinkByCode);

// Protected routes
router.use(authenticateToken);

// Create payment link (seller only)
router.post('/', createPaymentLink);

// Get seller's payment links
router.get('/seller/:business_id', getSellerPaymentLinks);

// Update payment link status
router.put('/:link_id/status', updatePaymentLinkStatus);

// Add payment link items to cart (buyer)
router.post('/:link_code/add-to-cart', addPaymentLinkToCart);

export default router;

