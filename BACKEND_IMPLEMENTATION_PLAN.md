# 🚀 Backend Implementation Plan for Airavat E-commerce

## 📋 Current Status Analysis

### ✅ What's Already Working:
- User registration & authentication (JWT)
- Business management
- Product CRUD operations
- Categories, Orders, Reviews
- RFQ (Inquiries & Quotations)
- Chat system (Socket.io)
- Notifications

### ❌ What's Missing for Full E-commerce:
1. **Cart Management** - No cart/session management
2. **Favorites/Wishlist** - No favorites system
3. **Advanced Search** - Basic search exists but needs enhancement
4. **Pagination** - Missing on most endpoints
5. **File Upload** - No image upload endpoint
6. **Address Management** - No dedicated address endpoints
7. **Password Reset** - No forgot password flow
8. **Email Verification** - No email verification system
9. **Frontend API Client** - No centralized API service
10. **CORS Configuration** - Needs frontend URL update

---

## 🎯 Implementation Plan

### Phase 1: Core E-commerce Features (Priority: HIGH)

#### 1.1 Cart Management System
**New Routes:**
- `POST /api/v1/cart` - Add item to cart
- `GET /api/v1/cart` - Get user's cart
- `PUT /api/v1/cart/:itemId` - Update cart item quantity
- `DELETE /api/v1/cart/:itemId` - Remove item from cart
- `DELETE /api/v1/cart` - Clear entire cart

**Database:** Use existing `order_items` or create `cart_items` table

#### 1.2 Favorites/Wishlist System
**New Routes:**
- `POST /api/v1/favorites` - Add product to favorites
- `GET /api/v1/favorites` - Get user's favorites
- `DELETE /api/v1/favorites/:productId` - Remove from favorites
- `GET /api/v1/favorites/check/:productId` - Check if product is favorited

**Database:** Create `favorites` table (user_id, product_id, created_at)

#### 1.3 Enhanced Product Search & Filtering
**Enhancements:**
- Full-text search with PostgreSQL
- Filter by: price range, category, supplier, rating, location
- Sort by: price, rating, popularity, date
- Pagination support

**Route:** `GET /api/v1/products/search?q=...&category=...&minPrice=...&maxPrice=...&page=1&limit=20`

#### 1.4 Pagination for All List Endpoints
**Add to existing routes:**
- `?page=1&limit=20` query parameters
- Response includes: `data`, `pagination: { page, limit, total, totalPages }`

---

### Phase 2: User Experience Enhancements (Priority: MEDIUM)

#### 2.1 Address Management
**New Routes:**
- `POST /api/v1/addresses` - Add address
- `GET /api/v1/addresses` - Get user's addresses
- `PUT /api/v1/addresses/:id` - Update address
- `DELETE /api/v1/addresses/:id` - Delete address
- `PUT /api/v1/addresses/:id/default` - Set default address

**Database:** Create `addresses` table or add to existing schema

#### 2.2 File Upload System
**New Routes:**
- `POST /api/v1/upload/image` - Upload product image
- `POST /api/v1/upload/document` - Upload business document
- `DELETE /api/v1/upload/:fileId` - Delete uploaded file

**Implementation:**
- Use `multer` for file handling
- Store in `uploads/` directory or cloud storage (S3, Cloudinary)
- Validate file types and sizes

#### 2.3 Password Reset Flow
**New Routes:**
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/resend-verification` - Resend verification email

**Implementation:**
- Generate secure tokens
- Send emails (use nodemailer or SendGrid)
- Token expiry (1 hour)

---

### Phase 3: Frontend Integration (Priority: HIGH)

#### 3.1 API Client Service
**Create:** `Airavat/lib/api/client.ts`

**Features:**
- Centralized API configuration
- Automatic token management
- Request/response interceptors
- Error handling
- TypeScript types

**Example:**
```typescript
import { apiClient } from '@/lib/api/client';

// Usage
const products = await apiClient.products.getAll();
const user = await apiClient.auth.login(email, password);
```

#### 3.2 Environment Configuration
**Update:** `.env` files for both frontend and backend

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

**Backend `.env`:**
```
FRONTEND_URL=http://localhost:3001
PORT=3000
```

---

### Phase 4: Advanced Features (Priority: LOW)

#### 4.1 Analytics & Tracking
- Product view tracking
- Search analytics
- User behavior tracking

#### 4.2 Recommendations
- "You may also like" products
- "Recently viewed" products
- "Trending" products

#### 4.3 Caching
- Redis for session management
- Cache popular products
- Cache categories

---

## 🛠️ Technical Improvements

### 1. Error Handling
- Standardized error responses
- Error logging (Winston or similar)
- Error codes enum

### 2. Validation
- Use `express-validator` for all inputs
- Create validation schemas
- Sanitize inputs

### 3. Security Enhancements
- Rate limiting (already exists, enhance)
- Input sanitization
- SQL injection prevention (Prisma handles this)
- XSS protection
- CSRF tokens for state-changing operations

### 4. Performance
- Database indexing
- Query optimization
- Response compression
- Connection pooling

### 5. Testing
- Unit tests for controllers
- Integration tests for routes
- E2E tests for critical flows

---

## 📁 File Structure Additions

```
src/
├── controllers/
│   ├── cart-controller.ts          [NEW]
│   ├── favorites-controller.ts     [NEW]
│   ├── address-controller.ts       [NEW]
│   ├── upload-controller.ts        [NEW]
│   └── auth-controller.ts          [NEW - password reset, email verification]
├── routes/
│   ├── cart-routes.ts              [NEW]
│   ├── favorites-routes.ts         [NEW]
│   ├── address-routes.ts           [NEW]
│   ├── upload-routes.ts            [NEW]
│   └── auth-routes.ts              [NEW]
├── services/
│   ├── email-service.ts            [NEW]
│   ├── file-upload-service.ts      [NEW]
│   └── search-service.ts           [NEW]
├── utils/
│   ├── pagination.ts               [NEW]
│   └── validators.ts               [ENHANCE]
└── types/
    └── api-types.ts                [NEW - TypeScript interfaces]
```

---

## 🗄️ Database Schema Additions

```prisma
// Cart items (session-based or user-based)
model cart_items {
  cart_item_id    BigInt   @id @default(autoincrement())
  user_id         BigInt?  @db.BigInt  // Nullable for guest carts
  session_id      String?  @db.VarChar(255)  // For guest carts
  product_id      BigInt   @db.BigInt
  quantity        Int
  created_at      DateTime @default(now())
  updated_at      DateTime @default(now()) @updatedAt
  
  user            users?   @relation(fields: [user_id], references: [user_id])
  product         products @relation(fields: [product_id], references: [product_id])
  
  @@unique([user_id, product_id])
  @@unique([session_id, product_id])
  @@map("cart_items")
}

// Favorites/Wishlist
model favorites {
  favorite_id     BigInt   @id @default(autoincrement())
  user_id         BigInt   @db.BigInt
  product_id      BigInt   @db.BigInt
  created_at      DateTime @default(now())
  
  user            users    @relation(fields: [user_id], references: [user_id])
  product         products @relation(fields: [product_id], references: [product_id])
  
  @@unique([user_id, product_id])
  @@map("favorites")
}

// Addresses
model addresses {
  address_id      BigInt   @id @default(autoincrement())
  user_id         BigInt   @db.BigInt
  business_id     BigInt?  @db.BigInt
  type            String   @db.VarChar(20)  // 'billing', 'shipping', 'business'
  address_line1   String   @db.VarChar(255)
  address_line2   String?  @db.VarChar(255)
  city            String   @db.VarChar(100)
  state           String   @db.VarChar(100)
  country         String   @db.VarChar(100) @default("India")
  pincode         String   @db.VarChar(20)
  landmark        String?  @db.VarChar(255)
  is_default      Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @default(now()) @updatedAt
  
  user            users    @relation(fields: [user_id], references: [user_id])
  business        business? @relation(fields: [business_id], references: [business_id])
  
  @@map("addresses")
}

// Password reset tokens
model password_reset_tokens {
  token_id        BigInt   @id @default(autoincrement())
  user_id         BigInt   @db.BigInt
  token           String   @unique @db.VarChar(255)
  expires_at      DateTime
  used            Boolean  @default(false)
  created_at      DateTime @default(now())
  
  user            users    @relation(fields: [user_id], references: [user_id])
  
  @@map("password_reset_tokens")
}

// Email verification tokens
model email_verification_tokens {
  token_id        BigInt   @id @default(autoincrement())
  user_id         BigInt   @db.BigInt
  token           String   @unique @db.VarChar(255)
  expires_at      DateTime
  verified        Boolean  @default(false)
  created_at      DateTime @default(now())
  
  user            users    @relation(fields: [user_id], references: [user_id])
  
  @@map("email_verification_tokens")
}
```

---

## 🔄 Implementation Order

1. **Database Migrations** - Add new tables
2. **Cart System** - Critical for e-commerce
3. **Favorites System** - High user value
4. **Enhanced Search** - Improve product discovery
5. **Pagination** - Performance improvement
6. **Address Management** - Needed for checkout
7. **File Upload** - For product images
8. **Password Reset** - User convenience
9. **Frontend API Client** - Connect everything
10. **Testing & Polish** - Ensure everything works

---

## 💡 Suggestions & Best Practices

### 1. API Response Format
Standardize all responses:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... },  // If applicable
  "meta": { ... }          // Additional metadata
}
```

### 2. Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

### 3. Authentication Strategy
- Store JWT in httpOnly cookies (more secure) OR
- Store in localStorage (current approach - simpler)
- Add refresh token mechanism for better security

### 4. CORS Configuration
Update to allow frontend origin:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
```

### 5. Environment Variables
Create `.env.example` files for both projects

### 6. API Documentation
- Use Swagger/OpenAPI
- Or create comprehensive markdown docs

---

## ⚠️ Important Considerations

1. **Port Conflicts**: Frontend (3001) and Backend (3000) should use different ports
2. **Database**: Ensure PostgreSQL is running and migrations are applied
3. **File Storage**: Decide on local storage vs cloud storage
4. **Email Service**: Choose email provider (SendGrid, AWS SES, etc.)
5. **Production**: Use environment variables, never commit secrets

---

## 🎯 Success Criteria

- [ ] All core e-commerce features working
- [ ] Frontend can successfully call all backend APIs
- [ ] User can register, login, browse products, add to cart, checkout
- [ ] Search and filtering work correctly
- [ ] File uploads work for product images
- [ ] Password reset flow works
- [ ] All endpoints have proper error handling
- [ ] API responses match frontend expectations
- [ ] CORS configured correctly
- [ ] Documentation complete

---

**Ready to implement?** Let me know if you want to proceed with this plan or if you'd like any modifications!

