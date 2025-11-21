import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { convertBigIntToString } from '../utils/main';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  businessId?: string;
  email?: string;
}

export function setupSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as any;
      socket.userId = decoded.userId;
      socket.email = decoded.email;

      // Get business ID from query or first business
      const businessId = socket.handshake.query.business_id as string;
      if (businessId) {
        socket.businessId = businessId;
      } else {
        // Get first business for user
        const user = await prisma.users.findUnique({
          where: { user_id: BigInt(decoded.userId) },
          include: { businesses: { take: 1 } },
        });
        if (user?.businesses[0]) {
          socket.businessId = user.businesses[0].business_id.toString();
        }
      }

      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (Business: ${socket.businessId})`);

    // Join business room for notifications
    if (socket.businessId) {
      socket.join(`business:${socket.businessId}`);
    }
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join conversation room
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        // Verify user has access to this conversation
        const conversation = await prisma.conversations.findUnique({
          where: { conversation_id: BigInt(conversationId) },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (socket.businessId && 
            conversation.buyer_business_id.toString() !== socket.businessId && 
            conversation.seller_business_id.toString() !== socket.businessId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('joined_conversation', { conversationId });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left_conversation', { conversationId });
    });

    // Send message
    socket.on('send_message', async (data: {
      conversation_id: string;
      message_type?: string;
      content?: string;
      metadata?: any;
    }) => {
      try {
        if (!socket.businessId) {
          socket.emit('error', { message: 'Business ID required' });
          return;
        }

        const { conversation_id, message_type = 'text', content, metadata } = data;

        // Verify conversation
        const conversation = await prisma.conversations.findUnique({
          where: { conversation_id: BigInt(conversation_id) },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (conversation.buyer_business_id.toString() !== socket.businessId && 
            conversation.seller_business_id.toString() !== socket.businessId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create message
        const message = await prisma.chat_messages.create({
          data: {
            conversation_id: BigInt(conversation_id),
            sender_business_id: BigInt(socket.businessId),
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

        // Update conversation
        await prisma.conversations.update({
          where: { conversation_id: BigInt(conversation_id) },
          data: { last_message_at: new Date() },
        });

        const safeMessage = convertBigIntToString(message);

        // Emit to all users in the conversation room
        io.to(`conversation:${conversation_id}`).emit('new_message', safeMessage);

        // Create notification for recipient
        const recipientBusinessId = 
          conversation.buyer_business_id.toString() === socket.businessId
            ? conversation.seller_business_id
            : conversation.buyer_business_id;

        const recipientBusiness = await prisma.business.findUnique({
          where: { business_id: recipientBusinessId },
          select: { user_id: true },
        });

        if (recipientBusiness) {
          const notification = await prisma.notifications.create({
            data: {
              user_id: recipientBusiness.user_id,
              business_id: recipientBusinessId,
              type: 'message',
              title: 'New Message',
              message: content || 'You received a new message',
              link: `/chat/${conversation_id}`,
              metadata: {
                conversation_id,
                sender_business_id: socket.businessId,
              },
            },
          });

          // Emit notification to recipient
          io.to(`business:${recipientBusinessId.toString()}`).emit('new_notification', convertBigIntToString(notification));
        }

        // Emit typing stop
        socket.to(`conversation:${conversation_id}`).emit('typing_stop', {
          business_id: socket.businessId,
        });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing_start', (data: { conversation_id: string }) => {
      socket.to(`conversation:${data.conversation_id}`).emit('typing_start', {
        business_id: socket.businessId,
      });
    });

    socket.on('typing_stop', (data: { conversation_id: string }) => {
      socket.to(`conversation:${data.conversation_id}`).emit('typing_stop', {
        business_id: socket.businessId,
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data: { conversation_id: string }) => {
      try {
        if (!socket.businessId) return;

        await prisma.chat_messages.updateMany({
          where: {
            conversation_id: BigInt(data.conversation_id),
            sender_business_id: { not: BigInt(socket.businessId) },
            is_read: false,
          },
          data: {
            is_read: true,
            read_at: new Date(),
          },
        });

        // Notify other party that messages were read
        socket.to(`conversation:${data.conversation_id}`).emit('messages_read', {
          business_id: socket.businessId,
          conversation_id: data.conversation_id,
        });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
}

