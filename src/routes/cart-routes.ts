import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  updateDeliveryOption,
} from '../controllers/cart-controller';
import { authenticateToken } from '../middlewares/auth-middleware';

const router = Router();

// Get cart (works with or without auth - supports guest carts)
router.get('/', getCart);

// Protected routes
router.use(authenticateToken);

// Add to cart
router.post('/', addToCart);

// Update cart item
router.put('/:cart_item_id', updateCartItem);

// Update delivery option
router.put('/:cart_item_id/delivery', updateDeliveryOption);

// Remove from cart
router.delete('/:cart_item_id', removeFromCart);

// Clear cart
router.delete('/', clearCart);

export default router;

