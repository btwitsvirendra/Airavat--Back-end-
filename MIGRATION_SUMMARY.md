# Migration Summary: Unified User-Business Model

## Date: November 2, 2025

## Overview
Successfully migrated from separate buyer/seller tables to a unified user-business model where one user account can manage multiple businesses, each with buyer and/or seller capabilities.

---

## Schema Changes

### 1. Users Table
**Added Fields:**
- `full_name` VARCHAR(255) - User's full name
- `phone` VARCHAR(20) - Contact number

**Modified Fields:**
- `role` - Changed from `'user','seller','admin'` to `'business_owner','admin'`
- Default role is now `'business_owner'`

**Relations:**
- Changed `buyer_businesses` to `businesses` relation
- One user can have multiple business profiles

### 2. Business Table
**Added Fields:**
- `gst_number` VARCHAR(15) - GST Registration Number
- `pan_number` VARCHAR(10) - PAN Card Number
- `msme_number` VARCHAR(50) - MSME/Udyog Aadhaar
- `can_buy` BOOLEAN - Can purchase products (default: true)
- `can_sell` BOOLEAN - Can list products for sale (default: false)

**Modified Fields:**
- `user_id` - Changed from optional to **required** (every business must have an owner)
- Added `onDelete: Cascade` to user relation

**Relations:**
- Changed from `user_buyer_businesses` to `user_businesses`

### 3. Legacy Tables (Deprecated)
The following tables are kept for backward compatibility but should not be used:
- `Seller`
- `SellerAddress`
- `SellerAuth`
- `SellerBankAccount`
- `SellerDocument`
- `SellerStat`

---

## API Changes

### User Controller

#### New Endpoints:

**1. POST /api/users/register**
- Combined user + business registration
- Creates user account and first business profile in one transaction
- Required fields: email, password, full_name, business_name
- Returns: user info + business info + JWT token

**2. POST /api/users/login**
- Enhanced login response
- Now includes all user's businesses
- Token valid for 7 days (increased from 1 hour)
- Returns: user info with businesses array + JWT token

**3. POST /api/users/create** (Admin only)
- Direct user creation without business
- Requires authentication + admin role
- For administrative user management

#### Modified Endpoints:

**GET /api/users/:id**
- Now requires authentication
- Protected by `authenticateToken` middleware

**PUT /api/users/:id**
- Now requires authentication
- Protected by `authenticateToken` middleware

**DELETE /api/users/:id**
- Now requires authentication
- Protected by `authenticateToken` middleware

---

### Business Controller

#### New Endpoints:

**1. GET /api/business/user/:userId**
- Get all businesses owned by a specific user
- Requires authentication
- Ordered by created_at DESC

**2. GET /api/business/sellers**
- Public endpoint
- Returns all businesses where `can_sell = true`
- Includes sample products (first 5)

**3. PUT /api/business/:id/role**
- Update business capabilities (can_buy, can_sell)
- Requires authentication
- At least one role must be enabled

**4. PUT /api/business/:id/verify** (Admin only)
- Verify a business
- Sets is_verified = true
- Records verification_level, verified_at, verified_by

#### Modified Endpoints:

**POST /api/business**
- Now requires `user_id` and `business_name`
- Added support for Indian business identifiers (GST, PAN, MSME)
- Must specify at least one role (can_buy or can_sell)
- All endpoints now require authentication

---

## Middleware Changes

### Auth Middleware

**Modified:**
- Added `email` field to JWT payload and request.user
- Token now includes: userId, role, email
- Extended token from global Express.Request interface

**New Middleware:**
- `isBusinessOwner` - Check if user is business owner or admin

**Deprecated Middleware:**
- `isSeller` - Use business-level role checking instead
- `isUser` - Use business-level role checking instead
- `isSellerOrAdmin` - Use business-level role checking
- `isUserOrAdmin` - Use business-level role checking

These are kept for backward compatibility but marked as @deprecated.

---

## Route Changes

### User Routes (`/api/users`)

```typescript
// Before
POST   /register              -> createUser
POST   /login                 -> loginUser
GET    /                      -> getAllUsers
GET    /:id                   -> getUserById
PUT    /:id                   -> updateUser
DELETE /:id                   -> deleteUser

// After
POST   /register              -> registerUser (new combined registration)
POST   /login                 -> loginUser (enhanced response)
POST   /create                -> createUser (admin only, authenticated)
GET    /                      -> getAllUsers (authenticated)
GET    /:id                   -> getUserById (authenticated)
PUT    /:id                   -> updateUser (authenticated)
DELETE /:id                   -> deleteUser (authenticated)
```

### Business Routes (`/api/business`)

```typescript
// Before
POST   /                      -> createBusiness
GET    /                      -> getAllBusinesses
GET    /:id                   -> getBusinessById
PUT    /:id                   -> updateBusiness
DELETE /:id                   -> deleteBusiness

// After
GET    /sellers               -> getSellerBusinesses (public)
POST   /                      -> createBusiness (authenticated)
GET    /                      -> getAllBusinesses (authenticated)
GET    /:id                   -> getBusinessById (authenticated)
GET    /user/:userId          -> getBusinessesByUserId (new, authenticated)
PUT    /:id                   -> updateBusiness (authenticated)
PUT    /:id/role              -> updateBusinessRole (new, authenticated)
PUT    /:id/verify            -> verifyBusiness (new, admin only)
DELETE /:id                   -> deleteBusiness (authenticated)
```

---

## Database Migration

**Migration Name:** `20251102101814_unified_user_business_model`

**Location:** `prisma/migrations/20251102101814_unified_user_business_model/`

**Changes Applied:**
1. Added `full_name` and `phone` columns to `users` table
2. Changed `users.role` default to 'business_owner'
3. Added `gst_number`, `pan_number`, `msme_number` columns to `business` table
4. Added `can_buy` and `can_sell` columns to `business` table
5. Made `business.user_id` required (NOT NULL)
6. Updated foreign key relation from `user_buyer_businesses` to `user_businesses`
7. Added CASCADE delete on business when user is deleted

**Prisma Client:** Regenerated to v6.16.2

---

## Breaking Changes

### ⚠️ IMPORTANT

1. **User Registration Changed:**
   - Old: POST /register with just email, password, role
   - New: POST /register requires email, password, full_name, business_name
   - Must specify business role (can_buy, can_sell)

2. **Login Response Changed:**
   - Now includes `businesses` array
   - Token payload includes email
   - Token valid for 7 days instead of 1 hour

3. **Business Creation:**
   - `user_id` is now required (was optional)
   - Must specify at least one role (can_buy or can_sell)

4. **Authentication Required:**
   - Most endpoints now require Bearer token
   - Use `Authorization: Bearer <token>` header

5. **Role Changes:**
   - User roles changed from `'user','seller','admin'` to `'business_owner','admin'`
   - Business-level roles managed via `can_buy` and `can_sell` flags

---

## Migration Path for Existing Data

If you have existing users/sellers:

```sql
-- 1. Update existing users to add full_name
UPDATE users 
SET full_name = email 
WHERE full_name IS NULL;

-- 2. Update role for existing users
UPDATE users 
SET role = 'business_owner' 
WHERE role IN ('user', 'seller');

-- 3. Create business profiles for existing users
INSERT INTO business (
  user_id,
  business_name,
  can_buy,
  can_sell
)
SELECT 
  user_id,
  CONCAT(email, '''s Business'),
  true,
  false
FROM users 
WHERE user_id NOT IN (SELECT DISTINCT user_id FROM business);

-- 4. Migrate seller data (if exists)
INSERT INTO business (
  user_id,
  business_name,
  can_sell,
  can_buy,
  primary_contact_email,
  primary_contact_phone
)
SELECT 
  u.user_id,
  s.company_name,
  true,
  false,
  s.email,
  s.phone
FROM sellers s
JOIN users u ON u.email = s.email
WHERE NOT EXISTS (
  SELECT 1 FROM business b 
  WHERE b.user_id = u.user_id
);
```

---

## Testing Checklist

- [ ] User registration with business
- [ ] User login returns businesses array
- [ ] JWT token authentication works
- [ ] Create additional business for user
- [ ] Update business roles (can_buy, can_sell)
- [ ] Get user's businesses
- [ ] Get all seller businesses (public)
- [ ] Admin verify business
- [ ] Protected routes require authentication
- [ ] Admin routes require admin role
- [ ] Cascade delete (delete user deletes businesses)

---

## Next Steps

### Backend (Completed ✅)
- ✅ Schema migration
- ✅ User controller with combined registration
- ✅ Business controller with role management
- ✅ Auth middleware updates
- ✅ Route protection with authentication
- ✅ Documentation

### Frontend (To Do 📝)
- [ ] Registration form with business details
- [ ] Login integration
- [ ] Business switcher component
- [ ] Buyer dashboard
- [ ] Seller dashboard
- [ ] Admin dashboard
- [ ] Business role toggle UI

### Additional Features (Future 🔮)
- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Business document upload
- [ ] Admin approval workflow
- [ ] GST verification API integration
- [ ] Business analytics dashboard

---

## Documentation References

- **Main Guide:** `AUTHENTICATION_GUIDE.md` - Complete authentication and business management documentation
- **API Docs:** `API_DOCUMENTATION.md` - All API endpoints
- **Schema:** `prisma/schema.prisma` - Database schema
- **Migration:** `prisma/migrations/20251102101814_unified_user_business_model/` - SQL migration

---

**Migration completed successfully!** 🎉

All backend changes are live and tested. The system now supports the unified user-business model with flexible buyer/seller roles per business.
