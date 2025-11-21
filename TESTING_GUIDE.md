# 🧪 Backend Testing Guide

## Prerequisites

1. **Database Setup**
   - PostgreSQL must be running
   - Database created (e.g., `airavat`)
   - `.env` file configured with `DATABASE_URL`

2. **Dependencies Installed**
   ```bash
   npm install
   ```

---

## Step 1: Run Database Migration

```bash
# Navigate to backend directory
cd C:\Users\iamvi\Documents\GitHub\alladinnow-nodejs-server

# Run migration
npx prisma migrate dev --name add_payment_links_cart_invoices

# Generate Prisma Client
npx prisma generate
```

**Expected Output:**
- Migration files created
- Database tables created
- Prisma Client generated

---

## Step 2: Start Backend Server

```bash
# Start development server
npm run dev
```

**Expected Output:**
```
🚀 Airavat API Server is running on http://localhost:3000
📡 Socket.io server is ready for real-time connections
📚 API Base URL: http://localhost:3000/api/v1
```

---

## Step 3: Test Endpoints

### Option A: Using Postman (Recommended)

1. **Import Collection** (see below for endpoints)
2. **Set Environment Variables:**
   - `base_url`: `http://localhost:3000/api/v1`
   - `token`: (will be set after login)

### Option B: Using curl (Command Line)

See examples below.

### Option C: Using Test Script

Run the automated test script:
```bash
npm run test:api
```

---

## Testing Flow

### 1. Health Check (No Auth Required)

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

---

### 2. Register a User (Seller)

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "password": "Test123!",
    "full_name": "Test Seller",
    "phone": "+91 9876543210",
    "business_name": "Test Seller Business",
    "can_buy": false,
    "can_sell": true,
    "gst_number": "27AAAAA0000A1Z5",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001"
  }'
```

**Save the response token!**

---

### 3. Register a User (Buyer)

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "Test123!",
    "full_name": "Test Buyer",
    "phone": "+91 9876543211",
    "business_name": "Test Buyer Business",
    "can_buy": true,
    "can_sell": false,
    "city": "Delhi",
    "state": "Delhi",
    "country": "India",
    "pincode": "110001"
  }'
```

**Save the response token!**

---

### 4. Login (Get Auth Token)

```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "password": "Test123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... },
    "business": { ... }
  }
}
```

**Copy the token for use in subsequent requests!**

---

### 5. Create a Product (Seller)

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -d '{
    "business_id": "YOUR_SELLER_BUSINESS_ID",
    "category_id": "1",
    "product_name": "Test Product",
    "description": "This is a test product",
    "base_price": 1000,
    "min_order_quantity": 1,
    "available_quantity": 100,
    "unit_in_stock": 100,
    "status": "active"
  }'
```

---

### 6. Create a Conversation (Buyer)

```bash
curl -X POST http://localhost:3000/api/v1/chat/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN" \
  -d '{
    "buyer_business_id": "YOUR_BUYER_BUSINESS_ID",
    "seller_business_id": "YOUR_SELLER_BUSINESS_ID",
    "product_id": "YOUR_PRODUCT_ID"
  }'
```

---

### 7. Send Messages in Chat

```bash
# Seller sends message
curl -X POST http://localhost:3000/api/v1/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -d '{
    "conversation_id": "CONVERSATION_ID",
    "content": "Hello! I can offer you a special price of ₹900 per unit."
  }'

# Buyer sends message
curl -X POST http://localhost:3000/api/v1/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN" \
  -d '{
    "conversation_id": "CONVERSATION_ID",
    "content": "That sounds good! Can you create a payment link?"
  }'
```

---

### 8. Create Payment Link from Chat (Seller)

```bash
curl -X POST http://localhost:3000/api/v1/chat/payment-links/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -d '{
    "conversation_id": "CONVERSation_ID",
    "items": [
      {
        "product_id": "PRODUCT_ID",
        "quantity": 10,
        "negotiated_price": 900,
        "notes": "Special negotiated price"
      }
    ],
    "title": "Special Offer - Test Product",
    "description": "Negotiated price for bulk order",
    "expires_in_days": 7
  }'
```

**Response includes `link_code` - save it!**

---

### 9. Get Payment Link (Public - No Auth)

```bash
curl http://localhost:3000/api/v1/payment-links/code/YOUR_LINK_CODE
```

---

### 10. Add Payment Link to Cart (Buyer)

```bash
curl -X POST http://localhost:3000/api/v1/payment-links/YOUR_LINK_CODE/add-to-cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN" \
  -d '{
    "business_id": "YOUR_BUYER_BUSINESS_ID",
    "delivery_option": "platform_delivery",
    "delivery_notes": "Please deliver to office address"
  }'
```

---

### 11. Get Cart (Buyer)

```bash
curl http://localhost:3000/api/v1/cart?business_id=YOUR_BUYER_BUSINESS_ID \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN"
```

---

### 12. Update Delivery Option

```bash
curl -X PUT http://localhost:3000/api/v1/cart/CART_ITEM_ID/delivery \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN" \
  -d '{
    "delivery_option": "seller_delivery",
    "delivery_notes": "Seller will arrange delivery"
  }'
```

---

### 13. Create Invoice (Seller)

```bash
curl -X POST http://localhost:3000/api/v1/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -d '{
    "payment_link_id": "PAYMENT_LINK_ID",
    "seller_business_id": "YOUR_SELLER_BUSINESS_ID",
    "buyer_business_id": "YOUR_BUYER_BUSINESS_ID",
    "notes": "Invoice for negotiated order"
  }'
```

---

### 14. Get Invoices

```bash
# Get seller invoices
curl http://localhost:3000/api/v1/invoices/business/YOUR_SELLER_BUSINESS_ID?role=seller \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN"

# Get buyer invoices
curl http://localhost:3000/api/v1/invoices/business/YOUR_BUYER_BUSINESS_ID?role=buyer \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN"
```

---

## Quick Test Script

Create a file `test-api.js`:

```javascript
const API_BASE = 'http://localhost:3000/api/v1';

async function test() {
  // 1. Health check
  const health = await fetch('http://localhost:3000/health');
  console.log('Health:', await health.json());

  // 2. Register seller
  const sellerReg = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'seller@test.com',
      password: 'Test123!',
      full_name: 'Test Seller',
      phone: '+91 9876543210',
      business_name: 'Test Seller Business',
      can_sell: true,
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001'
    })
  });
  const sellerData = await sellerReg.json();
  console.log('Seller registered:', sellerData);
  const sellerToken = sellerData.data?.token;

  // 3. Login seller
  const sellerLogin = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'seller@test.com',
      password: 'Test123!'
    })
  });
  const sellerLoginData = await sellerLogin.json();
  console.log('Seller logged in:', sellerLoginData);

  // Continue with other tests...
}

test().catch(console.error);
```

---

## Common Issues & Solutions

### Issue: "Migration failed"
**Solution:** 
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Ensure database exists

### Issue: "Port 3000 already in use"
**Solution:**
- Change PORT in `.env`
- Or stop other process using port 3000

### Issue: "Authentication failed"
**Solution:**
- Check token is included in Authorization header
- Format: `Bearer YOUR_TOKEN`
- Token might be expired (7 days default)

### Issue: "CORS error"
**Solution:**
- Check FRONTEND_URL in backend `.env`
- Should be `http://localhost:3001` (not 3000)

---

## Testing Checklist

- [ ] Health check works
- [ ] User registration works
- [ ] User login works
- [ ] Product creation works
- [ ] Chat conversation creation works
- [ ] Messages can be sent
- [ ] Payment link creation works
- [ ] Payment link retrieval works
- [ ] Add to cart from payment link works
- [ ] Cart management works
- [ ] Delivery options work
- [ ] Invoice creation works
- [ ] Invoice retrieval works

---

## Postman Collection

You can create a Postman collection with these endpoints:

1. **Environment Variables:**
   - `base_url`: `http://localhost:3000/api/v1`
   - `token`: (set after login)
   - `seller_business_id`: (from registration)
   - `buyer_business_id`: (from registration)

2. **Pre-request Script (for authenticated endpoints):**
   ```javascript
   pm.request.headers.add({
     key: 'Authorization',
     value: 'Bearer ' + pm.environment.get('token')
   });
   ```

---

**Happy Testing!** 🚀
