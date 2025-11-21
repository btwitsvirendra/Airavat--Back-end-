import { Request, Response } from 'express';
import { createOrderFromChat, createQuoteFromChat } from '../utils/chat-helpers';

/**
 * Create order directly from chat conversation
 * This endpoint is called when buyer and seller agree on a deal
 */
export async function createOrderFromChatEndpoint(req: Request, res: Response) {
  try {
    const {
      conversation_id,
      product_id,
      quantity,
      agreed_price,
      currency_id = 1,
      delivery_address,
      delivery_city,
      delivery_state,
      delivery_pincode,
      delivery_country,
      buyer_notes,
    } = req.body;

    const businessId = (req as any).user?.businessId;
    const userId = (req as any).user?.userId;

    if (!businessId || !userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!conversation_id || !product_id || !quantity || !agreed_price) {
      return res.status(400).json({
        error: "conversation_id, product_id, quantity, and agreed_price are required",
      });
    }

    // Get conversation to determine buyer and seller
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const conversation = await prisma.conversations.findUnique({
      where: { conversation_id: BigInt(conversation_id) },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Determine buyer and seller
    const buyerBusinessId = conversation.buyer_business_id.toString();
    const sellerBusinessId = conversation.seller_business_id.toString();

    // Verify the requesting business is the buyer
    if (businessId !== buyerBusinessId) {
      return res.status(403).json({
        error: "Only the buyer can create an order from this conversation",
      });
    }

    const order = await createOrderFromChat(
      conversation_id,
      buyerBusinessId,
      sellerBusinessId,
      product_id,
      quantity,
      agreed_price,
      currency_id,
      {
        delivery_address,
        delivery_city,
        delivery_state,
        delivery_pincode,
        delivery_country,
        buyer_notes,
      }
    );

    // Emit order created event via Socket.io
    const io = req.app.locals.io || (req.app as any).get('io');
    if (io) {
      io.to(`conversation:${conversation_id}`).emit('order_created', order);
      io.to(`business:${sellerBusinessId}`).emit('new_order', order);
    }

    res.status(201).json({
      message: "Order created successfully from chat",
      order,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
}

/**
 * Create quotation from chat conversation
 */
export async function createQuoteFromChatEndpoint(req: Request, res: Response) {
  try {
    const {
      conversation_id,
      inquiry_id,
      price,
      quantity,
      validity_days = 30,
      delivery_time_days,
      payment_terms,
      other_terms,
    } = req.body;

    const businessId = (req as any).user?.businessId;

    if (!businessId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!conversation_id || !inquiry_id || !price || !quantity) {
      return res.status(400).json({
        error: "conversation_id, inquiry_id, price, and quantity are required",
      });
    }

    // Get conversation to verify seller
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const conversation = await prisma.conversations.findUnique({
      where: { conversation_id: BigInt(conversation_id) },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const sellerBusinessId = conversation.seller_business_id.toString();

    // Verify the requesting business is the seller
    if (businessId !== sellerBusinessId) {
      return res.status(403).json({
        error: "Only the seller can create a quotation from this conversation",
      });
    }

    const quotation = await createQuoteFromChat(
      conversation_id,
      inquiry_id,
      sellerBusinessId,
      price,
      quantity,
      validity_days,
      delivery_time_days,
      {
        payment_terms,
        other_terms,
      }
    );

    // Emit quotation created event via Socket.io
    const io = req.app.locals.io || (req.app as any).get('io');
    if (io) {
      io.to(`conversation:${conversation_id}`).emit('quotation_created', quotation);
    }

    res.status(201).json({
      message: "Quotation created successfully from chat",
      quotation,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create quotation" });
  }
}

