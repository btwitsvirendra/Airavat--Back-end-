import { Router } from "express";
import {
  getOrCreateConversation,
  getBusinessConversations,
  getConversationMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsRead,
} from "../controllers/chat-controller";
import {
  createOrderFromChatEndpoint,
  createQuoteFromChatEndpoint,
} from "../controllers/chat-order-controller";
import { createPaymentLinkFromChat } from "../controllers/payment-link-controller";
import { authenticateToken } from "../middlewares/auth-middleware";
import { chatLimiter } from "../middlewares/rate-limit";
import { validateMessage } from "../middlewares/validation";

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

// Conversation routes
router.post("/conversations", getOrCreateConversation);
router.get("/conversations/business/:business_id", getBusinessConversations);
router.get("/conversations/:conversation_id/messages", getConversationMessages);
router.post("/messages", chatLimiter, validateMessage, sendMessage);
router.delete("/messages/:message_id", deleteMessage);
router.patch("/conversations/:conversation_id/read", markMessagesAsRead);

// Order and quotation creation from chat
router.post("/orders/create", createOrderFromChatEndpoint);
router.post("/quotations/create", createQuoteFromChatEndpoint);

// Payment link creation from chat (seller can generate payment link after negotiation)
router.post("/payment-links/create", createPaymentLinkFromChat);

export default router;

