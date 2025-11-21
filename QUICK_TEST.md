# ⚡ Quick Backend Testing Guide

## 🚀 Fast Setup (3 Steps)

### Step 1: Run Database Migration
```bash
npx prisma migrate dev --name add_payment_links_cart_invoices
npx prisma generate
```

### Step 2: Start Server
```bash
npm run dev
```

### Step 3: Test
```bash
# Option A: Run automated test script
npm run test:api

# Option B: Test manually with curl (see below)
```

---

## 🧪 Manual Testing (curl)

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Register & Login
```bash
# Register Seller
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@test.com","password":"Test123!","full_name":"Test Seller","phone":"+91 9876543210","business_name":"Test Seller Business","can_sell":true,"city":"Mumbai","state":"Maharashtra","country":"India","pincode":"400001"}'

# Login (save the token!)
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@test.com","password":"Test123!"}'
```

### 3. Create Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"business_id":"YOUR_BUSINESS_ID","category_id":"1","product_name":"Test Product","base_price":1000,"available_quantity":100,"status":"active"}'
```

### 4. Create Payment Link
```bash
curl -X POST http://localhost:3000/api/v1/payment-links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"seller_business_id":"YOUR_BUSINESS_ID","items":[{"product_id":"PRODUCT_ID","quantity":10,"negotiated_price":900}],"title":"Special Offer"}'
```

### 5. Get Payment Link (Public)
```bash
curl http://localhost:3000/api/v1/payment-links/code/YOUR_LINK_CODE
```

### 6. Add to Cart
```bash
curl -X POST http://localhost:3000/api/v1/payment-links/YOUR_LINK_CODE/add-to-cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BUYER_TOKEN" \
  -d '{"business_id":"BUYER_BUSINESS_ID","delivery_option":"platform_delivery"}'
```

### 7. Get Cart
```bash
curl http://localhost:3000/api/v1/cart?business_id=BUYER_BUSINESS_ID \
  -H "Authorization: Bearer BUYER_TOKEN"
```

---

## 📱 Using Postman

1. **Import Collection:**
   - Create new collection
   - Add environment variables:
     - `base_url`: `http://localhost:3000/api/v1`
     - `token`: (set after login)

2. **Test Flow:**
   - Register → Login → Create Product → Create Payment Link → Add to Cart → Get Cart

---

## 🔍 Verify Server is Running

Open browser: `http://localhost:3000/health`

Should see:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123.45
}
```

---

## ❗ Common Issues

**"Cannot connect"**
- Check server is running: `npm run dev`
- Check port 3000 is not in use

**"Migration failed"**
- Check PostgreSQL is running
- Verify `.env` has correct `DATABASE_URL`

**"Authentication failed"**
- Check token in Authorization header
- Format: `Bearer YOUR_TOKEN`
- Token might be expired

---

**For detailed testing, see `TESTING_GUIDE.md`** 📚
