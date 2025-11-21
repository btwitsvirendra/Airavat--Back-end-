# Airavat Backend - Complete Feature Implementation

## 🎉 Overview

This document describes the complete backend implementation for Airavat B2B E-commerce Platform with real-time chat, negotiation, and direct purchasing capabilities.

---

## ✨ Key Features Implemented

### 1. **Real-Time Chat System** 💬

#### Features:
- ✅ WebSocket-based real-time messaging using Socket.io
- ✅ One-on-one conversations between buyers and sellers
- ✅ Multiple message types: text, product, quote, order, file, image
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message persistence in database
- ✅ Conversation management

#### API Endpoints:
```
POST   /api/v1/chat/conversations              - Create or get conversation
GET    /api/v1/chat/conversations/business/:id  - Get all conversations for business
GET    /api/v1/chat/conversations/:id/messages - Get messages in conversation
POST   /api/v1/chat/messages                   - Send message (REST)
DELETE /api/v1/chat/messages/:id               - Delete message
PATCH  /api/v1/chat/conversations/:id/read     - Mark messages as read
```

#### Socket.io Events:

**Client → Server:**
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `send_message` - Send a message in real-time
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `mark_read` - Mark messages as read

**Server → Client:**
- `new_message` - New message received
- `typing_start` - Other user is typing
- `typing_stop` - Other user stopped typing
- `messages_read` - Messages were read by other party
- `order_created` - Order created from chat
- `quotation_created` - Quotation created from chat
- `new_notification` - New notification received
- `error` - Error occurred

#### Usage Example:
```javascript
// Frontend Socket.io connection
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  },
  query: {
    business_id: 'your_business_id'
  }
});

// Join conversation
socket.emit('join_conversation', conversationId);

// Send message
socket.emit('send_message', {
  conversation_id: conversationId,
  content: 'Hello!',
  message_type: 'text'
});

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

---

### 2. **Direct Purchase from Chat** 🛒

#### Features:
- ✅ Create orders directly from chat conversations
- ✅ Negotiate prices in real-time
- ✅ Agree on terms and create order instantly
- ✅ Automatic order number generation
- ✅ Order notifications to both parties

#### API Endpoint:
```
POST /api/v1/chat/orders/create
```

#### Request Body:
```json
{
  "conversation_id": "123",
  "product_id": "456",
  "quantity": 10,
  "agreed_price": 1500.00,
  "currency_id": 1,
  "delivery_address": "123 Main St",
  "delivery_city": "Mumbai",
  "delivery_state": "Maharashtra",
  "delivery_pincode": "400001",
  "delivery_country": "India",
  "buyer_notes": "Please deliver before 5 PM"
}
```

#### Response:
```json
{
  "message": "Order created successfully from chat",
  "order": {
    "order_id": "789",
    "order_number": "ORD-1234567890-ABC",
    "status": "pending",
    "final_amount": 15000.00,
    "order_items": [...]
  }
}
```

---

### 3. **Negotiation & Quotation System** 💰

#### Features:
- ✅ Create quotations from chat conversations
- ✅ Price negotiation in real-time
- ✅ Quote validity periods
- ✅ Delivery time estimates
- ✅ Payment terms negotiation

#### API Endpoint:
```
POST /api/v1/chat/quotations/create
```

#### Request Body:
```json
{
  "conversation_id": "123",
  "inquiry_id": "456",
  "price": 1500.00,
  "quantity": 10,
  "validity_days": 30,
  "delivery_time_days": 14,
  "payment_terms": "50% advance, 50% on delivery",
  "other_terms": "Free shipping for orders above $10000"
}
```

---

### 4. **Notifications System** 🔔

#### Features:
- ✅ Real-time notifications via Socket.io
- ✅ Notification types: message, order, inquiry, quotation, review, system
- ✅ Mark as read/unread
- ✅ Pagination support
- ✅ Unread count tracking

#### API Endpoints:
```
GET    /api/v1/notifications              - Get user notifications
GET    /api/v1/notifications/unread-count  - Get unread count
PATCH  /api/v1/notifications/:id/read      - Mark notification as read
PATCH  /api/v1/notifications/read-all      - Mark all as read
DELETE /api/v1/notifications/:id           - Delete notification
```

---

### 5. **Security Enhancements** 🔒

#### Rate Limiting:
- ✅ General API: 100 requests per 15 minutes
- ✅ Authentication: 5 attempts per 15 minutes
- ✅ Chat/Messaging: 30 messages per minute
- ✅ File Uploads: 20 uploads per hour

#### Input Validation:
- ✅ Email validation
- ✅ Password strength requirements (min 8 chars, uppercase, lowercase, number)
- ✅ Phone number validation
- ✅ Message length limits
- ✅ ID parameter validation
- ✅ Pagination validation

#### Authentication:
- ✅ JWT token-based authentication
- ✅ 7-day token expiry
- ✅ Token includes userId, role, email
- ✅ Socket.io authentication middleware
- ✅ Business ID validation

---

## 📊 Database Schema Updates

### New Models:

#### 1. `conversations`
- Links buyer and seller businesses
- Can be associated with product, inquiry, or order
- Tracks last message timestamp
- Active/inactive status

#### 2. `chat_messages`
- Stores all chat messages
- Supports multiple message types
- Read receipts
- Soft delete capability
- Metadata for rich content (products, quotes, orders)

#### 3. `notifications`
- User and business-level notifications
- Multiple notification types
- Read/unread status
- Links to relevant resources

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add_chat_and_notifications
npx prisma generate
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` with:
- REST API at `/api/v1`
- Socket.io server ready for WebSocket connections

---

## 🔌 Socket.io Connection

### Frontend Integration:

```typescript
import { io, Socket } from 'socket.io-client';

// Connect to Socket.io server
const socket: Socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token'), // JWT token
  },
  query: {
    business_id: currentBusinessId, // Current business ID
  },
  transports: ['websocket', 'polling'],
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

---

## 📝 Message Types

### Supported Message Types:

1. **`text`** - Plain text message
2. **`product`** - Product share with metadata
3. **`quote`** - Price quotation
4. **`order`** - Order reference
5. **`file`** - File attachment
6. **`image`** - Image attachment

### Example: Product Message

```javascript
socket.emit('send_message', {
  conversation_id: '123',
  message_type: 'product',
  content: 'Check out this product!',
  metadata: {
    product_id: '456',
    product_name: 'Laptop Computer',
    price: 999.99,
    image_url: 'https://example.com/image.jpg',
  }
});
```

---

## 🛡️ Security Best Practices

### Implemented:

1. ✅ **Rate Limiting** - Prevents abuse and DDoS
2. ✅ **Input Validation** - Prevents injection attacks
3. ✅ **JWT Authentication** - Secure token-based auth
4. ✅ **CORS Configuration** - Restricts cross-origin requests
5. ✅ **Password Hashing** - Bcrypt with salt rounds
6. ✅ **Business Ownership Validation** - Users can only access their own data

### Recommendations for Production:

1. **HTTPS/SSL** - Always use HTTPS in production
2. **Environment Variables** - Never commit secrets
3. **Database Connection Pooling** - Already using Prisma
4. **Logging & Monitoring** - Add Winston or similar
5. **Error Tracking** - Integrate Sentry or similar
6. **API Versioning** - Already implemented (`/api/v1`)
7. **Request Size Limits** - Already set (10mb)
8. **SQL Injection Protection** - Prisma handles this
9. **XSS Protection** - Validate and sanitize inputs
10. **CSRF Protection** - Consider adding CSRF tokens

---

## 🎯 User Experience Enhancements

### Implemented:

1. ✅ **Real-time Updates** - Instant message delivery
2. ✅ **Typing Indicators** - See when others are typing
3. ✅ **Read Receipts** - Know when messages are read
4. ✅ **Notifications** - Never miss important updates
5. ✅ **Pagination** - Efficient data loading
6. ✅ **Error Handling** - User-friendly error messages
7. ✅ **CamelCase Responses** - Frontend-friendly format

### Additional Recommendations:

1. **Message Search** - Full-text search in conversations
2. **File Upload** - Direct file sharing in chat
3. **Voice Messages** - Audio message support
4. **Video Calls** - Integration with WebRTC
5. **Message Reactions** - Emoji reactions to messages
6. **Message Forwarding** - Forward messages to other conversations
7. **Chat History Export** - Download conversation history
8. **Auto-translate** - Translate messages in real-time
9. **Smart Notifications** - Do-not-disturb hours
10. **Message Scheduling** - Schedule messages for later

---

## 📈 Performance Optimizations

### Implemented:

1. ✅ **Database Indexing** - Strategic indexes on foreign keys and frequently queried fields
2. ✅ **Pagination** - Prevents loading too much data at once
3. ✅ **Connection Pooling** - Prisma handles this automatically
4. ✅ **Rate Limiting** - Prevents server overload

### Recommendations:

1. **Redis Caching** - Cache frequently accessed data
2. **Message Batching** - Batch multiple messages
3. **Image Optimization** - Compress images before storage
4. **CDN Integration** - Serve static assets via CDN
5. **Database Query Optimization** - Use Prisma's query optimization
6. **WebSocket Connection Pooling** - Reuse connections
7. **Background Jobs** - Use Bull or similar for heavy tasks

---

## 🔄 Workflow Examples

### Complete Buyer-Seller Interaction:

1. **Buyer browses products** → `GET /api/v1/products`
2. **Buyer clicks "Chat with Seller"** → `POST /api/v1/chat/conversations`
3. **Buyer sends message** → Socket.io `send_message` event
4. **Seller receives notification** → Real-time notification
5. **Seller responds** → Socket.io `send_message` event
6. **Price negotiation** → Multiple messages with `message_type: 'quote'`
7. **Agreement reached** → `POST /api/v1/chat/orders/create`
8. **Order created** → Both parties receive notifications
9. **Order tracking** → `GET /api/v1/orders/:id`

---

## 📚 API Documentation

### Base URL:
```
http://localhost:3000/api/v1
```

### Socket.io Server:
```
http://localhost:3000
```

### Authentication:
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## 🧪 Testing

### Test Chat Flow:

```bash
# 1. Register user
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "Test123!",
    "full_name": "Test Buyer",
    "phone": "+91 9876543210",
    "business_name": "Test Buyer Business",
    "can_buy": true,
    "can_sell": false
  }'

# 2. Login
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "Test123!"
  }'

# 3. Create conversation
curl -X POST http://localhost:3000/api/v1/chat/conversations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_business_id": "1",
    "seller_business_id": "2",
    "product_id": "1"
  }'

# 4. Send message via REST
curl -X POST http://localhost:3000/api/v1/chat/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "1",
    "content": "Hello, I'm interested in this product",
    "message_type": "text"
  }'
```

---

## 🎨 Frontend Integration Guide

### 1. Chat Component Structure:

```typescript
// ChatContainer.tsx
const ChatContainer = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(API_URL, {
      auth: { token: getToken() },
      query: { business_id: currentBusinessId },
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // ... rest of component
};
```

### 2. Message Sending:

```typescript
const sendMessage = (content: string) => {
  if (socket && activeConversation) {
    socket.emit('send_message', {
      conversation_id: activeConversation.id,
      content,
      message_type: 'text',
    });
  }
};
```

### 3. Create Order from Chat:

```typescript
const createOrder = async (productId: string, quantity: number, price: number) => {
  const response = await fetch('/api/v1/chat/orders/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: activeConversation.id,
      product_id: productId,
      quantity,
      agreed_price: price,
      delivery_address: '...',
      // ... other fields
    }),
  });

  const data = await response.json();
  // Handle order creation
};
```

---

## 🚨 Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 📦 File Structure

```
src/
├── config/
│   ├── db.ts
│   └── socket-server.ts          # Socket.io setup
├── controllers/
│   ├── chat-controller.ts        # Chat CRUD operations
│   ├── chat-order-controller.ts  # Order/quotation from chat
│   ├── notification-controller.ts # Notifications
│   └── ...
├── middlewares/
│   ├── auth-middleware.ts        # JWT authentication
│   ├── rate-limit.ts            # Rate limiting
│   └── validation.ts             # Input validation
├── routes/
│   ├── chat-routes.ts           # Chat endpoints
│   ├── notification-routes.ts   # Notification endpoints
│   └── ...
├── utils/
│   ├── chat-helpers.ts          # Chat utility functions
│   ├── transform-response.ts    # Data transformation
│   └── main.ts                  # General utilities
└── index.ts                     # Main server file
```

---

## 🔐 Environment Variables

Required `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/airavat"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## ✅ Testing Checklist

- [ ] User registration and login
- [ ] Create conversation
- [ ] Send messages via REST API
- [ ] Send messages via Socket.io
- [ ] Receive real-time messages
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] Create order from chat
- [ ] Create quotation from chat
- [ ] Notifications received in real-time
- [ ] Rate limiting works
- [ ] Input validation works
- [ ] Authentication required for protected routes

---

## 🎯 Next Steps

### Immediate:
1. Run database migration
2. Test Socket.io connection
3. Test chat flow end-to-end
4. Test order creation from chat

### Short-term:
1. Add file upload support
2. Implement message search
3. Add message reactions
4. Implement chat history export

### Long-term:
1. Add video/voice call support
2. Implement AI chatbot for common queries
3. Add message translation
4. Implement smart notifications

---

## 📞 Support

For issues or questions:
1. Check the API documentation
2. Review error messages
3. Check server logs
4. Verify database connection
5. Ensure all environment variables are set

---

**Backend Implementation Complete!** 🎉

Your Airavat B2B platform now has:
- ✅ Real-time chat
- ✅ Direct purchasing
- ✅ Negotiation system
- ✅ Notifications
- ✅ Security features
- ✅ User-friendly APIs

Ready for frontend integration! 🚀

