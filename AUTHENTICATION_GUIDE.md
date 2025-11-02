# Authentication & Business Management Guide

## Overview

AladinNow uses a **unified account system** where:
- **One User Account** can manage multiple businesses
- Each **Business** can have dual roles: Buyer, Seller, or Both
- Role-based access control at the user level (business_owner, admin)
- Business-level capabilities (can_buy, can_sell)

This design matches Indian B2B platforms like IndiaMart and TradeIndia.

## Architecture

### User Model
```typescript
users {
  user_id        // Unique identifier
  email          // Login credential (unique)
  password_hash  // Encrypted password
  full_name      // Person's name
  phone          // Contact number
  role           // 'business_owner' or 'admin'
  is_verified    // Email verification status
  email_verified // Boolean flag
  status         // 'active', 'inactive', 'suspended'
  businesses[]   // Array of business profiles
}
```

### Business Model
```typescript
business {
  business_id       // Unique identifier
  user_id           // Owner reference (required)
  business_name     // Display name
  
  // Business Roles
  can_buy           // Boolean: Can purchase products
  can_sell          // Boolean: Can list products
  
  // Indian Business Details
  gst_number        // GST Registration (15 chars)
  pan_number        // PAN Card (10 chars)
  msme_number       // MSME/Udyog Aadhaar
  
  // Business Info
  business_type_id  // Manufacturing, Trading, Service, etc.
  description       // Business description
  address_line1, city, state, country, pincode
  
  // Verification
  is_verified       // Admin verified
  verification_level // 'basic', 'premium', 'verified'
}
```

## API Endpoints

### 1. User Registration

**POST** `/api/users/register`

Register a new user with their first business profile.

**Request Body:**
```json
{
  // User Details
  "email": "manoj@manojtraders.com",
  "password": "SecurePass123!",
  "full_name": "Manoj Kumar",
  "phone": "+91 9876543210",
  
  // Business Details
  "business_name": "Manoj Cricket Manufacturing",
  "business_type_id": 1,
  "can_buy": true,
  "can_sell": true,
  
  // Indian Business Identifiers
  "gst_number": "29ABCDE1234F1Z5",
  "pan_number": "ABCDE1234F",
  "msme_number": "UDYAM-MH-00-0000000",
  
  // Address
  "description": "Cricket equipment manufacturer",
  "address_line1": "123 Industrial Area",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001"
}
```

**Response:**
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
    "business_name": "Manoj Cricket Manufacturing",
    "can_buy": true,
    "can_sell": true,
    "gst_number": "29ABCDE1234F1Z5"
  }
}
```

### 2. User Login

**POST** `/api/users/login`

Login returns user info with all their business profiles.

**Request Body:**
```json
{
  "email": "manoj@manojtraders.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "user_id": "1",
    "email": "manoj@manojtraders.com",
    "full_name": "Manoj Kumar",
    "phone": "+91 9876543210",
    "role": "business_owner",
    "businesses": [
      {
        "business_id": "1",
        "business_name": "Manoj Cricket Manufacturing",
        "can_buy": true,
        "can_sell": true
      },
      {
        "business_id": "2",
        "business_name": "Manoj Wholesale Trading",
        "can_buy": true,
        "can_sell": false
      }
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Create Additional Business

**POST** `/api/business`
**Headers:** `Authorization: Bearer <token>`

Add another business profile to existing user account.

**Request Body:**
```json
{
  "user_id": "1",
  "business_name": "Manoj Raw Materials Procurement",
  "business_type_id": 2,
  "can_buy": true,
  "can_sell": false,
  "description": "Procurement of raw materials"
}
```

### 4. Get User's Businesses

**GET** `/api/business/user/:userId`
**Headers:** `Authorization: Bearer <token>`

Returns all businesses owned by a user.

### 5. Update Business Role

**PUT** `/api/business/:id/role`
**Headers:** `Authorization: Bearer <token>`

Enable/disable buyer or seller capabilities.

**Request Body:**
```json
{
  "can_buy": true,
  "can_sell": true
}
```

### 6. Get All Seller Businesses

**GET** `/api/business/sellers`

Public endpoint - returns all businesses with `can_sell = true`.

### 7. Verify Business (Admin Only)

**PUT** `/api/business/:id/verify`
**Headers:** `Authorization: Bearer <token>`

Admin verifies a business.

**Request Body:**
```json
{
  "verification_level": "premium",
  "verified_by": "1"
}
```

## Frontend Implementation

### Registration Flow

```typescript
// Step 1: User Registration Form
interface RegistrationData {
  // User Info
  email: string;
  password: string;
  full_name: string;
  phone: string;
  
  // Business Info
  business_name: string;
  business_type_id: number;
  can_buy: boolean;      // Checkbox: "I want to buy"
  can_sell: boolean;     // Checkbox: "I want to sell"
  
  // Indian Details
  gst_number?: string;
  pan_number?: string;
  msme_number?: string;
  
  // Address
  address_line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// Registration Component
const RegistrationForm = () => {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    business_name: '',
    business_type_id: 1,
    can_buy: true,
    can_sell: false,
    country: 'India'
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    // Store token and redirect to dashboard
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* User fields */}
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <input name="full_name" required />
      <input name="phone" />
      
      {/* Business fields */}
      <input name="business_name" required />
      
      {/* Business Role Selection */}
      <label>
        <input 
          type="checkbox" 
          checked={formData.can_buy}
          onChange={(e) => setFormData({...formData, can_buy: e.target.checked})}
        />
        I want to buy products
      </label>
      
      <label>
        <input 
          type="checkbox" 
          checked={formData.can_sell}
          onChange={(e) => setFormData({...formData, can_sell: e.target.checked})}
        />
        I want to sell products
      </label>
      
      {/* Indian Business Details */}
      <input name="gst_number" placeholder="GST Number (optional)" />
      <input name="pan_number" placeholder="PAN Number (optional)" />
      
      <button type="submit">Register</button>
    </form>
  );
};
```

### Dashboard Structure

```typescript
// Main Dashboard with Business Switcher
const Dashboard = () => {
  const { user } = useAuth();
  const [currentBusiness, setCurrentBusiness] = useState(user.businesses[0]);

  return (
    <div>
      {/* Business Switcher */}
      <select 
        value={currentBusiness.business_id}
        onChange={(e) => {
          const business = user.businesses.find(
            b => b.business_id === e.target.value
          );
          setCurrentBusiness(business);
        }}
      >
        {user.businesses.map(biz => (
          <option key={biz.business_id} value={biz.business_id}>
            {biz.business_name}
            {biz.can_buy && ' 🛒'}
            {biz.can_sell && ' 🏪'}
          </option>
        ))}
      </select>

      {/* Dynamic Dashboard Based on Business Role */}
      <div className="dashboard-content">
        {currentBusiness.can_buy && <BuyerDashboard business={currentBusiness} />}
        {currentBusiness.can_sell && <SellerDashboard business={currentBusiness} />}
      </div>
    </div>
  );
};
```

### Dashboard Routes

```typescript
// Route Structure
/dashboard                    // Business selection/overview
/dashboard/buyer/:businessId  // Buyer operations
  ├─ /browse                  // Browse products
  ├─ /orders                  // Purchase orders
  ├─ /inquiries               // RFQs sent
  └─ /suppliers               // Saved suppliers

/dashboard/seller/:businessId // Seller operations
  ├─ /products                // Product catalog
  ├─ /orders                  // Sales orders
  ├─ /quotations              // RFQs received
  └─ /customers               // Customer list

/admin                        // Admin panel
  ├─ /users                   // User management
  ├─ /businesses              // Business verification
  └─ /reports                 // Analytics
```

## Use Case Example: Manoj Traders

### Scenario
**Manoj Traders Pvt Ltd** manufactures cricket equipment but also needs raw materials.

### Account Setup
```
User Account:
  Email: manoj@manojtraders.com
  Name: Manoj Kumar
  
Business 1: "Manoj Cricket Manufacturing"
  Role: Seller (can_sell: true)
  Products: Cricket bats, balls, helmets
  
Business 2: "Manoj Raw Materials Division"
  Role: Buyer (can_buy: true)
  Purchases: Willow wood, leather, cork
  
Business 3: "Manoj Wholesale"
  Role: Both (can_buy: true, can_sell: true)
  Buys in bulk, sells to retailers
```

### Daily Workflow

**Morning - Selling Activities:**
1. Login with manoj@manojtraders.com
2. Switch to "Manoj Cricket Manufacturing" (Seller)
3. Check orders received
4. Update product inventory
5. Respond to buyer inquiries

**Afternoon - Buying Activities:**
1. Same login (no need to logout)
2. Switch to "Manoj Raw Materials Division" (Buyer)
3. Browse for willow wood suppliers
4. Send inquiries for leather
5. Place order for cork material

## Benefits

✅ **Single Login:** One email, one password for all activities
✅ **Multiple Businesses:** Unlimited business profiles per user
✅ **Flexible Roles:** Each business independently buyer/seller/both
✅ **GST Compliant:** Separate GST per business entity
✅ **Scalable:** Easy to add more businesses later
✅ **Clear Audit Trail:** All activities tracked per business
✅ **Indian Context:** Built-in GST, PAN, MSME support

## Migration from Legacy System

If you have old `Seller` table data:

```sql
-- Migrate sellers to new business model
INSERT INTO business (
  user_id, business_name, can_sell, can_buy,
  primary_contact_email, primary_contact_phone
)
SELECT 
  u.user_id,
  s.company_name,
  true,  -- can_sell
  false, -- can_buy
  s.email,
  s.phone
FROM sellers s
JOIN users u ON u.email = s.email;
```

## Security Considerations

1. **Password:** Bcrypt hashed with salt rounds = 10
2. **JWT Token:** 7-day expiry, include userId, role, email
3. **Business Ownership:** Validate user_id matches token before operations
4. **Admin Actions:** Require isAdmin middleware for verification
5. **Rate Limiting:** Implement on registration/login endpoints

## Next Steps

1. ✅ Schema updated with unified model
2. ✅ Controllers updated with new registration flow
3. ✅ Routes updated with authentication
4. ✅ Middleware updated with new roles
5. ⏳ Frontend registration component
6. ⏳ Frontend dashboard with business switcher
7. ⏳ Frontend buyer dashboard
8. ⏳ Frontend seller dashboard
9. ⏳ Admin dashboard for verification

---

**Last Updated:** November 2, 2025
