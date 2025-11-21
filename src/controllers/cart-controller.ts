import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';

const prisma = new PrismaClient();

/**
 * Get user's cart
 */
export async function getCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { business_id, session_id } = req.query;

    let where: any = {};

    if (userId) {
      where.user_id = BigInt(userId);
    } else if (business_id) {
      where.business_id = BigInt(business_id as string);
    } else if (session_id) {
      where.session_id = session_id as string;
    } else {
      return res.status(400).json({ error: 'user_id, business_id, or session_id is required' });
    }

    const cartItems = await prisma.cart_items.findMany({
      where,
      include: {
        product: {
          include: {
            images: true,
            category: true,
            currency: true,
            price_unit: true,
            business: {
              select: {
                business_id: true,
                business_name: true,
                display_name: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate totals
    let subtotal = 0;
    const items = cartItems.map((item) => {
      const unitPrice = item.negotiated_price 
        ? parseFloat(item.negotiated_price.toString())
        : parseFloat(item.product.base_price?.toString() || '0');
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      return {
        ...convertBigIntToString(item),
        calculatedPrice: {
          unitPrice,
          total: itemTotal,
        },
      };
    });

    const safeCartItems = convertBigIntToString(cartItems);

    return res.status(200).json({
      success: true,
      data: {
        items: items,
        summary: {
          subtotal,
          itemCount: cartItems.length,
          totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        },
      },
    });
  } catch (err: any) {
    console.error('Error fetching cart:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch cart' });
  }
}

/**
 * Add item to cart
 */
export async function addToCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { business_id, product_id, quantity, negotiated_price, delivery_option, delivery_notes, session_id } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'product_id and quantity are required' });
    }

    // Get product
    const product = await prisma.products.findUnique({
      where: { product_id: BigInt(product_id) },
      include: {
        images: {
          where: { is_primary: true },
          take: 1,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check availability
    if (product.available_quantity !== null && quantity > product.available_quantity) {
      return res.status(400).json({ 
        error: `Only ${product.available_quantity} units available`,
        availableQuantity: product.available_quantity,
      });
    }

    // Determine buyer business
    let buyerBusinessId = business_id;
    if (!buyerBusinessId && userId) {
      const userBusiness = await prisma.business.findFirst({
        where: {
          user_id: BigInt(userId),
          can_buy: true,
        },
      });
      if (userBusiness) {
        buyerBusinessId = userBusiness.business_id.toString();
      }
    }

    // Check if item already exists in cart with same delivery option
    const existingCartItem = await prisma.cart_items.findFirst({
      where: {
        ...(userId ? { user_id: BigInt(userId) } : {}),
        ...(buyerBusinessId ? { business_id: BigInt(buyerBusinessId) } : {}),
        ...(session_id ? { session_id } : {}),
        product_id: BigInt(product_id),
        delivery_option: delivery_option || 'platform_delivery',
      },
    });

    let cartItem;
    if (existingCartItem) {
      // Update quantity
      cartItem = await prisma.cart_items.update({
        where: { cart_item_id: existingCartItem.cart_item_id },
        data: {
          quantity: existingCartItem.quantity + quantity,
          negotiated_price: negotiated_price || existingCartItem.negotiated_price,
          delivery_notes,
        },
        include: {
          product: {
            include: {
              images: true,
              category: true,
              currency: true,
              price_unit: true,
            },
          },
        },
      });
    } else {
      // Create new cart item
      const unitPrice = negotiated_price 
        ? parseFloat(negotiated_price.toString())
        : parseFloat(product.base_price?.toString() || '0');

      cartItem = await prisma.cart_items.create({
        data: {
          user_id: userId ? BigInt(userId) : null,
          business_id: buyerBusinessId ? BigInt(buyerBusinessId) : null,
          session_id: session_id || null,
          product_id: BigInt(product_id),
          quantity,
          negotiated_price: negotiated_price ? parseFloat(negotiated_price.toString()) : null,
          delivery_option: delivery_option || 'platform_delivery',
          delivery_notes,
        },
        include: {
          product: {
            include: {
              images: true,
              category: true,
              currency: true,
              price_unit: true,
            },
          },
        },
      });
    }

    const safeCartItem = convertBigIntToString(cartItem);

    return res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: safeCartItem,
    });
  } catch (err: any) {
    console.error('Error adding to cart:', err);
    return res.status(500).json({ error: err.message || 'Failed to add item to cart' });
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { cart_item_id } = req.params;
    const { quantity, delivery_option, delivery_notes } = req.body;

    const cartItem = await prisma.cart_items.findUnique({
      where: { cart_item_id: BigInt(cart_item_id) },
      include: { product: true },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Verify ownership
    if (userId && cartItem.user_id && cartItem.user_id !== BigInt(userId)) {
      return res.status(403).json({ error: 'You do not have permission to update this cart item' });
    }

    // Check availability if quantity is being increased
    if (quantity && quantity > cartItem.quantity) {
      const increase = quantity - cartItem.quantity;
      if (cartItem.product.available_quantity !== null) {
        const available = cartItem.product.available_quantity;
        if (quantity > available) {
          return res.status(400).json({ 
            error: `Only ${available} units available`,
            availableQuantity: available,
          });
        }
      }
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (delivery_option) updateData.delivery_option = delivery_option;
    if (delivery_notes !== undefined) updateData.delivery_notes = delivery_notes;

    const updatedCartItem = await prisma.cart_items.update({
      where: { cart_item_id: BigInt(cart_item_id) },
      data: updateData,
      include: {
        product: {
          include: {
            images: true,
            category: true,
            currency: true,
            price_unit: true,
          },
        },
      },
    });

    const safeCartItem = convertBigIntToString(updatedCartItem);

    return res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: safeCartItem,
    });
  } catch (err: any) {
    console.error('Error updating cart item:', err);
    return res.status(500).json({ error: err.message || 'Failed to update cart item' });
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { cart_item_id } = req.params;

    const cartItem = await prisma.cart_items.findUnique({
      where: { cart_item_id: BigInt(cart_item_id) },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Verify ownership
    if (userId && cartItem.user_id && cartItem.user_id !== BigInt(userId)) {
      return res.status(403).json({ error: 'You do not have permission to remove this cart item' });
    }

    await prisma.cart_items.delete({
      where: { cart_item_id: BigInt(cart_item_id) },
    });

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
    });
  } catch (err: any) {
    console.error('Error removing from cart:', err);
    return res.status(500).json({ error: err.message || 'Failed to remove item from cart' });
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { business_id, session_id } = req.query;

    let where: any = {};

    if (userId) {
      where.user_id = BigInt(userId);
    } else if (business_id) {
      where.business_id = BigInt(business_id as string);
    } else if (session_id) {
      where.session_id = session_id as string;
    } else {
      return res.status(400).json({ error: 'user_id, business_id, or session_id is required' });
    }

    await prisma.cart_items.deleteMany({
      where,
    });

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (err: any) {
    console.error('Error clearing cart:', err);
    return res.status(500).json({ error: err.message || 'Failed to clear cart' });
  }
}

/**
 * Update delivery option for cart item
 */
export async function updateDeliveryOption(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { cart_item_id } = req.params;
    const { delivery_option, delivery_partner, delivery_notes } = req.body;

    if (!delivery_option) {
      return res.status(400).json({ error: 'delivery_option is required' });
    }

    const validOptions = ['pickup', 'buyer_delivery', 'seller_delivery', 'platform_delivery'];
    if (!validOptions.includes(delivery_option)) {
      return res.status(400).json({ 
        error: `Invalid delivery option. Must be one of: ${validOptions.join(', ')}` 
      });
    }

    const cartItem = await prisma.cart_items.findUnique({
      where: { cart_item_id: BigInt(cart_item_id) },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Verify ownership
    if (userId && cartItem.user_id && cartItem.user_id !== BigInt(userId)) {
      return res.status(403).json({ error: 'You do not have permission to update this cart item' });
    }

    const updateData: any = {
      delivery_option,
    };
    if (delivery_notes !== undefined) updateData.delivery_notes = delivery_notes;

    const updatedCartItem = await prisma.cart_items.update({
      where: { cart_item_id: BigInt(cart_item_id) },
      data: updateData,
      include: {
        product: {
          include: {
            images: true,
            category: true,
            currency: true,
            price_unit: true,
          },
        },
      },
    });

    const safeCartItem = convertBigIntToString(updatedCartItem);

    return res.status(200).json({
      success: true,
      message: 'Delivery option updated successfully',
      data: safeCartItem,
    });
  } catch (err: any) {
    console.error('Error updating delivery option:', err);
    return res.status(500).json({ error: err.message || 'Failed to update delivery option' });
  }
}

