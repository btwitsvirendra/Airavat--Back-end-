import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';

const prisma = new PrismaClient();

// Create or Get Conversation
export async function getOrCreateConversation(req: Request, res: Response) {
  try {
    const { buyer_business_id, seller_business_id, product_id, inquiry_id, order_id } = req.body;
    const businessId = (req as any).user?.businessId || req.body.business_id;

    if (!buyer_business_id || !seller_business_id) {
      return res.status(400).json({ error: "buyer_business_id and seller_business_id are required" });
    }

    // Validate that the requesting business is part of the conversation
    if (businessId !== buyer_business_id && businessId !== seller_business_id) {
      return res.status(403).json({ error: "You can only access conversations you're part of" });
    }

    // Try to find existing conversation
    let conversation = await prisma.conversations.findFirst({
      where: {
        buyer_business_id: BigInt(buyer_business_id),
        seller_business_id: BigInt(seller_business_id),
        product_id: product_id ? BigInt(product_id) : null,
        is_active: true,
      },
      include: {
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        product: {
          select: {
            product_id: true,
            product_name: true,
            base_price: true,
            images: {
              where: { is_primary: true },
              take: 1,
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    // Create new conversation if not found
    if (!conversation) {
      conversation = await prisma.conversations.create({
        data: {
          buyer_business_id: BigInt(buyer_business_id),
          seller_business_id: BigInt(seller_business_id),
          product_id: product_id ? BigInt(product_id) : null,
          inquiry_id: inquiry_id ? BigInt(inquiry_id) : null,
          order_id: order_id ? BigInt(order_id) : null,
        },
        include: {
          buyer_business: {
            select: {
              business_id: true,
              business_name: true,
              display_name: true,
            },
          },
          seller_business: {
            select: {
              business_id: true,
              business_name: true,
              display_name: true,
            },
          },
          product: {
            select: {
              product_id: true,
              product_name: true,
              base_price: true,
              images: {
                where: { is_primary: true },
                take: 1,
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { created_at: 'desc' },
          },
        },
      });
    }

    const safeConversation = convertBigIntToString(conversation);
    res.json({
      message: "Conversation fetched successfully",
      conversation: safeConversation,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get conversation" });
  }
}

// Get All Conversations for a Business
export async function getBusinessConversations(req: Request, res: Response) {
  try {
    const { business_id } = req.params;
    const businessId = (req as any).user?.businessId || business_id;

    if (!businessId) {
      return res.status(400).json({ error: "business_id is required" });
    }

    const conversations = await prisma.conversations.findMany({
      where: {
        OR: [
          { buyer_business_id: BigInt(businessId) },
          { seller_business_id: BigInt(businessId) },
        ],
        is_active: true,
      },
      include: {
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        product: {
          select: {
            product_id: true,
            product_name: true,
            base_price: true,
            images: {
              where: { is_primary: true },
              take: 1,
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          include: {
            sender_business: {
              select: {
                business_id: true,
                business_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        last_message_at: 'desc',
      },
    });

    const safeConversations = convertBigIntToString(conversations);
    res.json({
      message: "Conversations fetched successfully",
      conversations: safeConversations,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch conversations" });
  }
}

// Get Messages for a Conversation
export async function getConversationMessages(req: Request, res: Response) {
  try {
    const { conversation_id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const businessId = (req as any).user?.businessId;

    // Verify business is part of conversation
    const conversation = await prisma.conversations.findUnique({
      where: { conversation_id: BigInt(conversation_id) },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (businessId && 
        conversation.buyer_business_id.toString() !== businessId && 
        conversation.seller_business_id.toString() !== businessId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await prisma.chat_messages.findMany({
      where: {
        conversation_id: BigInt(conversation_id),
        is_deleted: false,
      },
      include: {
        sender_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: Number(limit),
      skip,
    });

    // Mark messages as read for the requesting business
    if (businessId) {
      await prisma.chat_messages.updateMany({
        where: {
          conversation_id: BigInt(conversation_id),
          sender_business_id: { not: BigInt(businessId) },
          is_read: false,
        },
        data: {
          is_read: true,
          read_at: new Date(),
        },
      });
    }

    const safeMessages = convertBigIntToString(messages);
    res.json({
      message: "Messages fetched successfully",
      messages: safeMessages.reverse(), // Reverse to show oldest first
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: messages.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch messages" });
  }
}

// Send Message (also used by Socket.io)
export async function sendMessage(req: Request, res: Response) {
  try {
    const { conversation_id, message_type = 'text', content, metadata } = req.body;
    const businessId = (req as any).user?.businessId || req.body.sender_business_id;

    if (!conversation_id || !businessId) {
      return res.status(400).json({ error: "conversation_id and sender_business_id are required" });
    }

    // Verify conversation exists and business is part of it
    const conversation = await prisma.conversations.findUnique({
      where: { conversation_id: BigInt(conversation_id) },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conversation.buyer_business_id.toString() !== businessId && 
        conversation.seller_business_id.toString() !== businessId) {
      return res.status(403).json({ error: "You can only send messages in your conversations" });
    }

    // Create message
    const message = await prisma.chat_messages.create({
      data: {
        conversation_id: BigInt(conversation_id),
        sender_business_id: BigInt(businessId),
        message_type,
        content,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
      include: {
        sender_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
      },
    });

    // Update conversation last_message_at
    await prisma.conversations.update({
      where: { conversation_id: BigInt(conversation_id) },
      data: { last_message_at: new Date() },
    });

    // Create notification for the other party
    const recipientBusinessId = 
      conversation.buyer_business_id.toString() === businessId
        ? conversation.seller_business_id
        : conversation.buyer_business_id;

    const recipientBusiness = await prisma.business.findUnique({
      where: { business_id: recipientBusinessId },
      select: { user_id: true },
    });

    if (recipientBusiness) {
      await prisma.notifications.create({
        data: {
          user_id: recipientBusiness.user_id,
          business_id: recipientBusinessId,
          type: 'message',
          title: 'New Message',
          message: content || 'You received a new message',
          link: `/chat/${conversation_id}`,
          metadata: {
            conversation_id: conversation_id.toString(),
            sender_business_id: businessId,
          },
        },
      });
    }

    const safeMessage = convertBigIntToString(message);
    res.status(201).json({
      message: "Message sent successfully",
      data: safeMessage,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send message" });
  }
}

// Delete Message
export async function deleteMessage(req: Request, res: Response) {
  try {
    const { message_id } = req.params;
    const businessId = (req as any).user?.businessId;

    const message = await prisma.chat_messages.findUnique({
      where: { message_id: BigInt(message_id) },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.sender_business_id.toString() !== businessId) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await prisma.chat_messages.update({
      where: { message_id: BigInt(message_id) },
      data: { is_deleted: true },
    });

    res.json({ message: "Message deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete message" });
  }
}

// Mark Messages as Read
export async function markMessagesAsRead(req: Request, res: Response) {
  try {
    const { conversation_id } = req.params;
    const businessId = (req as any).user?.businessId;

    if (!businessId) {
      return res.status(400).json({ error: "Business ID is required" });
    }

    await prisma.chat_messages.updateMany({
      where: {
        conversation_id: BigInt(conversation_id),
        sender_business_id: { not: BigInt(businessId) },
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    res.json({ message: "Messages marked as read" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to mark messages as read" });
  }
}

