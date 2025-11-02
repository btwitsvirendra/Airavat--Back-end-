# API Testing Examples

## Base URL
```
http://localhost:3000/api
```

## 1. User Registration (Combined with Business)

### Request
```bash
POST /api/users/register
Content-Type: application/json

{
  "email": "manoj@manojtraders.com",
  "password": "SecurePass123!",
  "full_name": "Manoj Kumar",
  "phone": "+91 9876543210",
  "business_name": "Manoj Cricket Manufacturing",
  "business_type_id": 1,
  "can_buy": true,
  "can_sell": true,
  "gst_number": "29ABCDE1234F1Z5",
  "pan_number": "ABCDE1234F",
  "msme_number": "UDYAM-MH-00-0000000",
  "description": "Cricket equipment manufacturer and distributor",
  "address_line1": "123 Industrial Area, Andheri East",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400069"
}
```

### Response
```json
{
  "message": "User and business registered successfully",
  "user": {
    "user_id": "1",
    "email": "manoj@manojtraders.com",
    "full_name": "Manoj Kumar",
    "phone": "+91 9876543210"
  },
  "business": {
    "business_id": "1",
    "user_id": "1",
    "business_name": "Manoj Cricket Manufacturing",
    "can_buy": true,
    "can_sell": true,
    "gst_number": "29ABCDE1234F1Z5",
    "pan_number": "ABCDE1234F",
    "city": "Mumbai",
    "state": "Maharashtra"
  }
}
```

---

## 2. User Login

### Request
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "manoj@manojtraders.com",
  "password": "SecurePass123!"
}
```

### Response
```json
{
  "message": "Login successful",
  "user": {
    "user_id": "1",
    "email": "manoj@manojtraders.com",
    "full_name": "Manoj Kumar",
    "phone": "+91 9876543210",
    "role": "business_owner",
    "is_verified": false,
    "status": "active",
    "businesses": [
      {
        "business_id": "1",
        "business_name": "Manoj Cricket Manufacturing",
        "can_buy": true,
        "can_sell": true,
        "gst_number": "29ABCDE1234F1Z5",
        "city": "Mumbai",
        "business_type": {
          "type_name": "Manufacturing"
        }
      }
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwicm9sZSI6ImJ1c2luZXNzX293bmVyIiwiZW1haWwiOiJtYW5vakBtYW5vanRyYWRlcnMuY29tIiwiaWF0IjoxNjk4OTI0ODAwLCJleHAiOjE2OTk1Mjk2MDB9.abc123"
}
```

**Save this token for subsequent requests!**

---

## 3. Create Additional Business

### Request
```bash
POST /api/business
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "1",
  "business_name": "Manoj Raw Materials Procurement",
  "business_type_id": 2,
  "can_buy": true,
  "can_sell": false,
  "description": "Procurement division for raw materials",
  "address_line1": "123 Industrial Area, Andheri East",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400069"
}
```

### Response
```json
{
  "message": "Business created successfully",
  "business": {
    "business_id": "2",
    "user_id": "1",
    "business_name": "Manoj Raw Materials Procurement",
    "can_buy": true,
    "can_sell": false,
    "city": "Mumbai"
  }
}
```

---

## 4. Get User's All Businesses

### Request
```bash
GET /api/business/user/1
Authorization: Bearer <token>
```

### Response
```json
{
  "message": "Fetched user businesses successfully",
  "businesses": [
    {
      "business_id": "2",
      "business_name": "Manoj Raw Materials Procurement",
      "can_buy": true,
      "can_sell": false,
      "created_at": "2025-11-02T10:30:00Z"
    },
    {
      "business_id": "1",
      "business_name": "Manoj Cricket Manufacturing",
      "can_buy": true,
      "can_sell": true,
      "created_at": "2025-11-02T10:20:00Z"
    }
  ]
}
```

---

## 5. Update Business Role

### Request - Enable Seller Capability
```bash
PUT /api/business/2/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "can_buy": true,
  "can_sell": true
}
```

### Response
```json
{
  "message": "Business role updated successfully",
  "business": {
    "business_id": "2",
    "business_name": "Manoj Raw Materials Procurement",
    "can_buy": true,
    "can_sell": true
  }
}
```

---

## 6. Get All Seller Businesses (Public)

### Request
```bash
GET /api/business/sellers
```

### Response
```json
{
  "message": "Fetched seller businesses successfully",
  "businesses": [
    {
      "business_id": "1",
      "business_name": "Manoj Cricket Manufacturing",
      "can_sell": true,
      "city": "Mumbai",
      "state": "Maharashtra",
      "business_type": {
        "type_name": "Manufacturing"
      },
      "products": [
        {
          "product_id": "1",
          "product_name": "Cricket Bat Professional",
          "base_price": "2500.00"
        }
      ]
    }
  ]
}
```

---

## 7. Get Business by ID

### Request
```bash
GET /api/business/1
Authorization: Bearer <token>
```

### Response
```json
{
  "message": "Business fetched successfully",
  "business": {
    "business_id": "1",
    "user_id": "1",
    "business_name": "Manoj Cricket Manufacturing",
    "can_buy": true,
    "can_sell": true,
    "gst_number": "29ABCDE1234F1Z5",
    "pan_number": "ABCDE1234F",
    "description": "Cricket equipment manufacturer and distributor",
    "address_line1": "123 Industrial Area, Andheri East",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400069",
    "is_verified": false,
    "business_type": {
      "type_name": "Manufacturing"
    }
  }
}
```

---

## 8. Update Business Details

### Request
```bash
PUT /api/business/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Leading cricket equipment manufacturer in Mumbai",
  "employee_count": 50,
  "year_established": 2015,
  "website_url": "https://manojtraders.com"
}
```

### Response
```json
{
  "message": "Business updated successfully",
  "business": {
    "business_id": "1",
    "business_name": "Manoj Cricket Manufacturing",
    "description": "Leading cricket equipment manufacturer in Mumbai",
    "employee_count": 50,
    "year_established": 2015,
    "website_url": "https://manojtraders.com"
  }
}
```

---

## 9. Verify Business (Admin Only)

### Request
```bash
PUT /api/business/1/verify
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "verification_level": "premium",
  "verified_by": "1"
}
```

### Response
```json
{
  "message": "Business verified successfully",
  "business": {
    "business_id": "1",
    "business_name": "Manoj Cricket Manufacturing",
    "is_verified": true,
    "verification_level": "premium",
    "verified_at": "2025-11-02T10:45:00Z",
    "verified_by": "1"
  }
}
```

---

## 10. Get User Info

### Request
```bash
GET /api/users/1
Authorization: Bearer <token>
```

### Response
```json
{
  "message": "User fetched successfully",
  "user": {
    "user_id": "1",
    "email": "manoj@manojtraders.com",
    "full_name": "Manoj Kumar",
    "phone": "+91 9876543210",
    "role": "business_owner",
    "is_verified": false,
    "status": "active",
    "created_at": "2025-11-02T10:20:00Z"
  }
}
```

---

## Testing Scenarios

### Scenario 1: Complete User Journey (Buyer + Seller)

```bash
# 1. Register
POST /api/users/register
{
  "email": "raj@rajenterprises.com",
  "password": "Pass123!",
  "full_name": "Raj Sharma",
  "phone": "+91 9988776655",
  "business_name": "Raj Textile Trading",
  "can_buy": true,
  "can_sell": true
}

# 2. Login
POST /api/users/login
{
  "email": "raj@rajenterprises.com",
  "password": "Pass123!"
}

# Save token from response

# 3. View my businesses
GET /api/business/user/2
Authorization: Bearer <token>

# 4. Add another business
POST /api/business
Authorization: Bearer <token>
{
  "user_id": "2",
  "business_name": "Raj Garments Export",
  "can_sell": true,
  "can_buy": false
}
```

### Scenario 2: Buyer Only

```bash
# Register as buyer
POST /api/users/register
{
  "email": "buyer@company.com",
  "password": "Pass123!",
  "full_name": "Amit Patel",
  "business_name": "Patel Procurement Services",
  "can_buy": true,
  "can_sell": false
}
```

### Scenario 3: Seller Only

```bash
# Register as seller
POST /api/users/register
{
  "email": "seller@factory.com",
  "password": "Pass123!",
  "full_name": "Priya Reddy",
  "business_name": "Reddy Manufacturing Co",
  "can_buy": false,
  "can_sell": true
}
```

### Scenario 4: Convert Buyer to Seller

```bash
# Update business role
PUT /api/business/3/role
Authorization: Bearer <token>
{
  "can_buy": true,
  "can_sell": true
}
```

---

## Error Responses

### 400 - Missing Required Fields
```json
{
  "error": "Missing required fields: email, password, full_name, business_name"
}
```

### 401 - Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 - Forbidden
```json
{
  "error": "Access denied. Admin privileges required."
}
```

### 404 - Not Found
```json
{
  "error": "User not found"
}
```

### 409 - Conflict
```json
{
  "error": "User with this email already exists"
}
```

---

## cURL Examples

### Register
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Pass123!",
    "full_name": "Test User",
    "phone": "+91 9876543210",
    "business_name": "Test Business",
    "can_buy": true,
    "can_sell": true
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Pass123!"
  }'
```

### Get Business (with auth)
```bash
curl -X GET http://localhost:3000/api/business/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Postman Collection

Import these endpoints into Postman:

1. Create Environment Variable:
   - `base_url`: http://localhost:3000/api
   - `token`: (will be set after login)

2. Use `{{base_url}}` and `{{token}}` in requests

3. Set token automatically after login:
   ```javascript
   // In Tests tab of login request
   pm.environment.set("token", pm.response.json().token);
   ```

---

**Ready to test!** 🚀
