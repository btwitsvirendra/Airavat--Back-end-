# Airavat API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Available Endpoints

### 1. Users (`/users`)

#### Register User
- **POST** `/users/register`
- **Body:**
```json
{
  "email": "user@example.com",
  "password_hash": "password123",
  "role": "buyer",
  "is_verified": false,
  "status": "active",
  "email_verified": false
}
```

#### Login User
- **POST** `/users/login`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get All Users
- **GET** `/users`

#### Get User by ID
- **GET** `/users/:id`

#### Update User
- **PUT** `/users/:id`
- **Body:** (any user fields to update)

#### Delete User
- **DELETE** `/users/:id`

---

### 2. Businesses (`/businesses`)

#### Create Business
- **POST** `/businesses`
- **Body:**
```json
{
  "business_name": "ABC Corp",
  "business_type_id": 1,
  "description": "Trading company",
  "license_number": "LIC123",
  "tax_number": "TAX456",
  "website_url": "https://abccorp.com",
  "employee_count": 50,
  "year_established": 2020,
  "is_verified": false
}
```

#### Get All Businesses
- **GET** `/businesses`

#### Get Business by ID
- **GET** `/businesses/:id`

#### Update Business
- **PUT** `/businesses/:id`
- **Body:** (any business fields to update)

#### Delete Business
- **DELETE** `/businesses/:id`

---

### 3. Categories (`/categories`)

#### Create Category
- **POST** `/categories`
- **Body:**
```json
{
  "parent_category_id": null,
  "category_name": "Electronics",
  "slug": "electronics",
  "description": "Electronic products",
  "is_active": true,
  "display_order": 1
}
```

#### Get All Categories
- **GET** `/categories`

#### Get Root Categories (Parent categories only)
- **GET** `/categories/root`

#### Get Category by ID
- **GET** `/categories/:id`

#### Update Category
- **PUT** `/categories/:id`
- **Body:** (any category fields to update)

#### Delete Category
- **DELETE** `/categories/:id`

---

### 4. Products (`/products`)

#### Create Product
- **POST** `/products`
- **Body:**
```json
{
  "category_id": 1,
  "product_name": "Laptop Computer",
  "slug": "laptop-computer",
  "description": "High-performance laptop",
  "specifications": "Intel i7, 16GB RAM",
  "base_price": 999.99,
  "currency": "USD",
  "price_unit": "piece",
  "min_order_quantity": 1,
  "max_order_quantity": 100,
  "unit_in_stock": 50,
  "available_quantity": 50,
  "hs_code": "8471.30",
  "brand": "TechBrand",
  "manufacturer": "TechManufacturer",
  "country_of_origin": "USA",
  "status": "active",
  "is_featured": true
}
```

#### Get All Products
- **GET** `/products`
- **Query Parameters:**
  - `category_id` (optional)
  - `status` (optional)
  - `is_featured` (optional)

#### Search Products
- **GET** `/products/search?query=laptop`

#### Get Product by ID
- **GET** `/products/:id`

#### Update Product
- **PUT** `/products/:id`
- **Body:** (any product fields to update)

#### Delete Product
- **DELETE** `/products/:id`

---

### 5. Orders (`/orders`)

#### Create Order
- **POST** `/orders`
- **Body:**
```json
{
  "buyer_business_id": 1,
  "seller_business_id": 2,
  "order_number": "ORD-2025-001",
  "status": "pending",
  "tax_amount": 50.00,
  "discount_amount": 10.00,
  "shipping_amount": 20.00,
  "final_amount": 1060.00,
  "currency": "USD",
  "delivery_address": "123 Main St",
  "delivery_city": "New York",
  "delivery_state": "NY",
  "delivery_pincode": "10001",
  "delivery_country": "USA",
  "expected_delivery_date": "2025-11-15",
  "payment_status": "pending",
  "buyer_notes": "Please deliver before 5 PM"
}
```

#### Get All Orders
- **GET** `/orders`
- **Query Parameters:**
  - `buyer_business_id` (optional)
  - `seller_business_id` (optional)
  - `status` (optional)

#### Get Order by ID
- **GET** `/orders/:id`

#### Update Order
- **PUT** `/orders/:id`
- **Body:** (any order fields to update)

#### Update Order Status
- **PATCH** `/orders/:id/status`
- **Body:**
```json
{
  "status": "confirmed"
}
```

#### Delete Order
- **DELETE** `/orders/:id`

---

### 6. Order Items (`/order-items`)

#### Create Order Item
- **POST** `/order-items`
- **Body:**
```json
{
  "order_id": 1,
  "product_id": 1,
  "product_name": "Laptop Computer",
  "quantity_unit": 5,
  "unit_price": 999.99,
  "discount_rate": 0.05,
  "total_price": 4749.95,
  "tax_rate": 0.10,
  "hs_code": "8471.30"
}
```

#### Get All Order Items
- **GET** `/order-items`
- **Query Parameters:**
  - `order_id` (optional)

#### Get Order Item by ID
- **GET** `/order-items/:id`

#### Update Order Item
- **PUT** `/order-items/:id`
- **Body:** (any order item fields to update)

#### Delete Order Item
- **DELETE** `/order-items/:id`

---

### 7. Reviews (`/reviews`)

#### Create Review
- **POST** `/reviews`
- **Body:**
```json
{
  "order_id": 1,
  "reviewer_business_id": 1,
  "reviewed_business_id": 2,
  "rating": 5,
  "review_text": "Excellent service and product quality!",
  "product_quality_rating": 5,
  "delivery_rating": 4,
  "communication_rating": 5,
  "is_approved": false
}
```

#### Get All Reviews
- **GET** `/reviews`
- **Query Parameters:**
  - `reviewed_business_id` (optional)
  - `is_approved` (optional)

#### Get Review by ID
- **GET** `/reviews/:id`

#### Update Review
- **PUT** `/reviews/:id`
- **Body:** (any review fields to update)

#### Approve Review
- **PATCH** `/reviews/:id/approve`

#### Delete Review
- **DELETE** `/reviews/:id`

---

### 8. Inquiries (`/inquiries`)

#### Create Inquiry
- **POST** `/inquiries`
- **Body:**
```json
{
  "buyer_business_id": 1,
  "product_id": 1,
  "inquiry_title": "Bulk order inquiry",
  "description": "Looking for 100 units",
  "required_quantity": 100,
  "budget_range": "50000-60000",
  "expected_delivery": "2025-12-01",
  "status": "open"
}
```

#### Get All Inquiries
- **GET** `/inquiries`
- **Query Parameters:**
  - `buyer_business_id` (optional)
  - `status` (optional)

#### Get Inquiry by ID
- **GET** `/inquiries/:id`

#### Update Inquiry
- **PUT** `/inquiries/:id`
- **Body:** (any inquiry fields to update)

#### Update Inquiry Status
- **PATCH** `/inquiries/:id/status`
- **Body:**
```json
{
  "status": "closed"
}
```

#### Delete Inquiry
- **DELETE** `/inquiries/:id`

---

### 9. Quotations (`/quotations`)

#### Create Quotation
- **POST** `/quotations`
- **Body:**
```json
{
  "inquiry_id": 1,
  "seller_business_id": 2,
  "validity_days": 30,
  "delivery_time_days": 14,
  "payment_terms": "50% advance, 50% on delivery",
  "other_terms": "Free shipping for orders above $10000",
  "status": "draft",
  "setup": "Standard setup included"
}
```

#### Get All Quotations
- **GET** `/quotations`
- **Query Parameters:**
  - `inquiry_id` (optional)
  - `seller_business_id` (optional)
  - `status` (optional)

#### Get Quotation by ID
- **GET** `/quotations/:id`

#### Update Quotation
- **PUT** `/quotations/:id`
- **Body:** (any quotation fields to update)

#### Update Quotation Status
- **PATCH** `/quotations/:id/status`
- **Body:**
```json
{
  "status": "sent"
}
```

#### Delete Quotation
- **DELETE** `/quotations/:id`

---

### 10. Sellers (`/sellers`)

#### Create Seller
- **POST** `/sellers`
- **Body:**
```json
{
  "company_name": "ABC Trading Co",
  "contact_person": "John Doe",
  "email": "john@abctrading.com",
  "phone": "+1234567890"
}
```

#### Get All Sellers
- **GET** `/sellers/all`

---

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Notes
1. All BigInt fields (IDs) are automatically converted to strings in responses
2. Authentication/Authorization middleware should be added before production
3. File upload endpoints for images and documents need to be implemented separately
4. Consider adding pagination for list endpoints
5. Add validation middleware for all endpoints
