import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Generate unique payment link code
 */
function generateLinkCode(): string {
  return `PL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Create a payment link with negotiated prices
 * Seller can create a custom payment link after negotiation in chat
 */
export async function createPaymentLink(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      buyer_business_id,
      conversation_id,
      title,
      description,
      items, // Array of { product_id, quantity, negotiated_price, notes }
      currency_id = 1,
      tax_amount,
      discount_amount,
      expires_in_days = 30, // Default 30 days expiry
      payment_gateway,
    } = req.body;

    const sellerBusinessId = req.body.seller_business_id || req.query.business_id;
    if (!sellerBusinessId) {
      return res.status(400).json({ error: 'seller_business_id is required' });
    }

    // Verify seller owns the business
    const sellerBusiness = await prisma.business.findFirst({
      where: {
        business_id: BigInt(sellerBusinessId),
        user_id: BigInt(userId),
        can_sell: true,
      },
    });

    if (!sellerBusiness) {
      return res.status(403).json({ error: 'You do not have permission to create payment links for this business' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Calculate totals
    let subtotal = 0;
    const paymentLinkItems = [];

    for (const item of items) {
      const product = await prisma.products.findUnique({
        where: { product_id: BigInt(item.product_id) },
        include: { currency: true, price_unit: true },
      });

      if (!product) {
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }

      // Use negotiated price if provided, otherwise use base price
      const unitPrice = item.negotiated_price 
        ? parseFloat(item.negotiated_price.toString())
        : parseFloat(product.base_price?.toString() || '0');

      const quantity = item.quantity || 1;
      const itemTotal = unitPrice * quantity;

      subtotal += itemTotal;

      paymentLinkItems.push({
        product_id: BigInt(item.product_id),
        product_name: product.product_name,
        quantity,
        negotiated_price: item.negotiated_price ? parseFloat(item.negotiated_price.toString()) : null,
        base_price: parseFloat(product.base_price?.toString() || '0'),
        unit_price: unitPrice,
        discount_rate: item.discount_rate || null,
        tax_rate: item.tax_rate || null,
        total_price: itemTotal,
        notes: item.notes || null,
      });
    }

    const tax = tax_amount ? parseFloat(tax_amount.toString()) : 0;
    const discount = discount_amount ? parseFloat(discount_amount.toString()) : 0;
    const finalAmount = subtotal + tax - discount;

    // Calculate expiry date
    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      : null;

    // Create payment link
    const linkCode = generateLinkCode();
    const paymentLink = await prisma.payment_links.create({
      data: {
        seller_business_id: BigInt(sellerBusinessId),
        buyer_business_id: buyer_business_id ? BigInt(buyer_business_id) : null,
        conversation_id: conversation_id ? BigInt(conversation_id) : null,
        link_code: linkCode,
        title: title || `Payment Link - ${sellerBusiness.business_name}`,
        description,
        currency_id,
        total_amount: subtotal,
        tax_amount: tax || null,
        discount_amount: discount || null,
        final_amount: finalAmount,
        status: 'active',
        expires_at: expiresAt,
        is_negotiated: items.some((item: any) => item.negotiated_price),
        payment_gateway: payment_gateway || null,
      },
      include: {
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        currency: true,
        payment_link_items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Create payment link items
    for (const item of paymentLinkItems) {
      await prisma.payment_link_items.create({
        data: {
          payment_link_id: paymentLink.payment_link_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          negotiated_price: item.negotiated_price,
          base_price: item.base_price,
          unit_price: item.unit_price,
          discount_rate: item.discount_rate,
          tax_rate: item.tax_rate,
          total_price: item.total_price,
          notes: item.notes,
        },
      });
    }

    // Reload with items
    const fullPaymentLink = await prisma.payment_links.findUnique({
      where: { payment_link_id: paymentLink.payment_link_id },
      include: {
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        currency: true,
        payment_link_items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const safePaymentLink = convertBigIntToString(fullPaymentLink);

    return res.status(201).json({
      success: true,
      message: 'Payment link created successfully',
      data: {
        ...safePaymentLink,
        paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/${linkCode}`,
      },
    });
  } catch (err: any) {
    console.error('Error creating payment link:', err);
    return res.status(500).json({ error: err.message || 'Failed to create payment link' });
  }
}

/**
 * Get payment link by code (public endpoint for buyers)
 */
export async function getPaymentLinkByCode(req: Request, res: Response) {
  try {
    const { link_code } = req.params;

    const paymentLink = await prisma.payment_links.findUnique({
      where: { link_code },
      include: {
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
            city: true,
            state: true,
          },
        },
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        currency: true,
        payment_link_items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    // Check if expired
    if (paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Payment link has expired' });
    }

    // Check if already used
    if (paymentLink.status === 'used') {
      return res.status(410).json({ error: 'Payment link has already been used' });
    }

    const safePaymentLink = convertBigIntToString(paymentLink);

    return res.status(200).json({
      success: true,
      data: safePaymentLink,
    });
  } catch (err: any) {
    console.error('Error fetching payment link:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch payment link' });
  }
}

/**
 * Get all payment links for a seller
 */
export async function getSellerPaymentLinks(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { business_id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    // Verify seller owns the business
    const sellerBusiness = await prisma.business.findFirst({
      where: {
        business_id: BigInt(business_id),
        user_id: BigInt(userId),
        can_sell: true,
      },
    });

    if (!sellerBusiness) {
      return res.status(403).json({ error: 'You do not have permission to view payment links for this business' });
    }

    const where: any = {
      seller_business_id: BigInt(business_id),
    };

    if (status) {
      where.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [paymentLinks, total] = await Promise.all([
      prisma.payment_links.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
        include: {
          buyer_business: {
            select: {
              business_id: true,
              business_name: true,
              display_name: true,
            },
          },
          currency: true,
          payment_link_items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { is_primary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      }),
      prisma.payment_links.count({ where }),
    ]);

    const safePaymentLinks = convertBigIntToString(paymentLinks);

    return res.status(200).json({
      success: true,
      data: safePaymentLinks,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (err: any) {
    console.error('Error fetching payment links:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch payment links' });
  }
}

/**
 * Update payment link status (mark as used, expired, etc.)
 */
export async function updatePaymentLinkStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { link_id } = req.params;
    const { status, payment_gateway_id, metadata } = req.body;

    const paymentLink = await prisma.payment_links.findUnique({
      where: { payment_link_id: BigInt(link_id) },
      include: {
        seller_business: true,
      },
    });

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    // Verify seller owns the business
    if (paymentLink.seller_business.user_id !== BigInt(userId)) {
      return res.status(403).json({ error: 'You do not have permission to update this payment link' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (payment_gateway_id) updateData.payment_gateway_id = payment_gateway_id;
    if (metadata) updateData.metadata = metadata;
    if (status === 'used') updateData.used_at = new Date();

    const updatedPaymentLink = await prisma.payment_links.update({
      where: { payment_link_id: BigInt(link_id) },
      data: updateData,
      include: {
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        currency: true,
        payment_link_items: {
          include: {
            product: true,
          },
        },
      },
    });

    const safePaymentLink = convertBigIntToString(updatedPaymentLink);

    return res.status(200).json({
      success: true,
      message: 'Payment link updated successfully',
      data: safePaymentLink,
    });
  } catch (err: any) {
    console.error('Error updating payment link:', err);
    return res.status(500).json({ error: err.message || 'Failed to update payment link' });
  }
}

/**
 * Create payment link from chat conversation
 * Seller can create a payment link directly from chat after negotiation
 */
export async function createPaymentLinkFromChat(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      conversation_id,
      items, // Array of { product_id, quantity, negotiated_price, notes }
      title,
      description,
      currency_id = 1,
      tax_amount,
      discount_amount,
      expires_in_days = 30,
    } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }

    // Get conversation
    const conversation = await prisma.conversations.findUnique({
      where: { conversation_id: BigInt(conversation_id) },
      include: {
        seller_business: true,
        buyer_business: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify seller owns the business
    if (conversation.seller_business.user_id !== BigInt(userId)) {
      return res.status(403).json({ error: 'Only the seller can create payment links from this conversation' });
    }

    // Use conversation details
    const sellerBusinessId = conversation.seller_business_id.toString();
    const buyerBusinessId = conversation.buyer_business_id.toString();

    // Create payment link using existing function logic
    const paymentLinkData = {
      seller_business_id: sellerBusinessId,
      buyer_business_id: buyerBusinessId,
      conversation_id: conversation_id.toString(),
      title: title || `Payment Link - ${conversation.seller_business.business_name}`,
      description: description || `Payment link generated from chat conversation`,
      items: items || [],
      currency_id,
      tax_amount,
      discount_amount,
      expires_in_days,
    };

    // Reuse createPaymentLink logic
    req.body = paymentLinkData;
    return await createPaymentLink(req, res);
  } catch (err: any) {
    console.error('Error creating payment link from chat:', err);
    return res.status(500).json({ error: err.message || 'Failed to create payment link from chat' });
  }
}

/**
 * Add payment link items to buyer's cart
 * This is called when buyer clicks the payment link
 */
export async function addPaymentLinkToCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { link_code } = req.params;
    const { business_id, delivery_option = 'platform_delivery', delivery_notes } = req.body;

    // Get payment link
    const paymentLink = await prisma.payment_links.findUnique({
      where: { link_code },
      include: {
        payment_link_items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    if (paymentLink.status !== 'active') {
      return res.status(400).json({ error: 'Payment link is not active' });
    }

    if (paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Payment link has expired' });
    }

    // Get or create buyer business
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

    if (!buyerBusinessId) {
      return res.status(400).json({ error: 'business_id is required' });
    }

    // Add items to cart
    const cartItems = [];
    for (const item of paymentLink.payment_link_items) {
      // Check if item already exists in cart
      const existingCartItem = await prisma.cart_items.findFirst({
        where: {
          business_id: BigInt(buyerBusinessId),
          product_id: item.product_id,
          delivery_option,
        },
      });

      if (existingCartItem) {
        // Update quantity and negotiated price
        await prisma.cart_items.update({
          where: { cart_item_id: existingCartItem.cart_item_id },
          data: {
            quantity: item.quantity,
            negotiated_price: item.negotiated_price || item.unit_price,
            delivery_option,
            delivery_notes,
          },
        });
      } else {
        // Create new cart item
        const cartItem = await prisma.cart_items.create({
          data: {
            user_id: userId ? BigInt(userId) : null,
            business_id: BigInt(buyerBusinessId),
            product_id: item.product_id,
            quantity: item.quantity,
            negotiated_price: item.negotiated_price || item.unit_price,
            delivery_option,
            delivery_notes,
          },
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        });
        cartItems.push(cartItem);
      }
    }

    // Mark payment link as used (optional - you might want to keep it active for multiple uses)
    // await prisma.payment_links.update({
    //   where: { payment_link_id: paymentLink.payment_link_id },
    //   data: { status: 'used', used_at: new Date() },
    // });

    const safeCartItems = convertBigIntToString(cartItems);

    return res.status(200).json({
      success: true,
      message: 'Items added to cart successfully',
      data: {
        cartItems: safeCartItems,
        paymentLink: {
          linkCode: paymentLink.link_code,
          totalAmount: paymentLink.final_amount,
          currency: paymentLink.currency_id,
        },
      },
    });
  } catch (err: any) {
    console.error('Error adding payment link to cart:', err);
    return res.status(500).json({ error: err.message || 'Failed to add items to cart' });
  }
}

