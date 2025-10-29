# 🚀 Quick Start Guide - Airavat API

## Installation

```bash
cd Alladinnow-nodejs-server
npm install
```

## Start Server

```bash
npm run dev
```

## Base URL

```
http://localhost:3000/api/v1
```

---

## 📋 Quick Endpoint Reference

### Authentication
```bash
POST /users/register    # Register
POST /users/login       # Login
```

### Core Resources
```bash
# Users
GET    /users          # List all
GET    /users/:id      # Get one
PUT    /users/:id      # Update
DELETE /users/:id      # Delete

# Businesses
GET    /businesses
POST   /businesses
GET    /businesses/:id
PUT    /businesses/:id
DELETE /businesses/:id

# Categories
GET    /categories
GET    /categories/root
POST   /categories
GET    /categories/:id
PUT    /categories/:id
DELETE /categories/:id

# Products
GET    /products
GET    /products/search?query=...
POST   /products
GET    /products/:id
PUT    /products/:id
DELETE /products/:id

# Product Images
GET    /product-images?product_id=...
POST   /product-images
PATCH  /product-images/:id/set-primary
DELETE /product-images/:id

# Orders
GET    /orders
POST   /orders
GET    /orders/:id
PUT    /orders/:id
PATCH  /orders/:id/status
DELETE /orders/:id

# Order Items
GET    /order-items?order_id=...
POST   /order-items
GET    /order-items/:id
PUT    /order-items/:id
DELETE /order-items/:id

# Reviews
GET    /reviews
POST   /reviews
GET    /reviews/:id
PUT    /reviews/:id
PATCH  /reviews/:id/approve
DELETE /reviews/:id

# Inquiries (RFQ)
GET    /inquiries
POST   /inquiries
GET    /inquiries/:id
PUT    /inquiries/:id
PATCH  /inquiries/:id/status
DELETE /inquiries/:id

# Quotations
GET    /quotations
POST   /quotations
GET    /quotations/:id
PUT    /quotations/:id
PATCH  /quotations/:id/status
DELETE /quotations/:id

# Sellers
GET    /sellers/all
POST   /sellers
```

---

## 🧪 Test with cURL

### Register User
```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password_hash":"pass123","role":"buyer"}'
```

### Create Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"category_id":1,"product_name":"Test Product","base_price":99.99}'
```

### Search Products
```bash
curl "http://localhost:3000/api/v1/products/search?query=test"
```

---

## 📂 File Structure

```
src/
├── controllers/     # 11 controller files
├── routes/          # 11 route files
├── config/          # Database config
├── utils/           # Helper functions
└── index.ts         # Main app
```

---

## 📚 Documentation Files

- `API_DOCUMENTATION.md` - Complete API reference
- `ROUTES_SUMMARY.md` - Detailed overview
- `PROJECT_COMPLETE.md` - Achievement summary
- `QUICK_START.md` - This file

---

## ⚡ Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Database
npx prisma migrate dev
npx prisma studio
```

---

## 🎯 Total Endpoints: 64+

All routes are ready for use! 🚀
