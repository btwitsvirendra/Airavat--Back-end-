# Airavat API Server

A Node.js/TypeScript REST API server for the Airavat B2B E-commerce Platform. Built with Express.js, Prisma ORM, and PostgreSQL.

## Overview

Airavat is a comprehensive B2B marketplace platform that enables businesses to:
- Register with multiple business profiles
- Buy and sell products
- Manage orders and inquiries
- Handle quotations and reviews
- Support multi-currency and multi-unit pricing

## Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)
- PostgreSQL database
- TypeScript
- tsup

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd alladinnow-nodejs-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/airavat"
   PORT=3000
   JWT_SECRET=your-secret-key-here
   FRONTEND_URL=http://localhost:3000
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. (Optional) Seed reference data:
   ```bash
   npx tsx src/config/seed-reference-tables.ts
   ```

## Development

Start the development server with hot-reload:
```bash
npm run dev
```

The server will start at `http://localhost:3000` (or the port specified in your .env file)

API Base URL: `http://localhost:3000/api/v1`

## Production Build

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

```
src/
├── index.ts              # Application entry point
├── routes/                # API route definitions
│   ├── user-routes.ts
│   ├── business-routes.ts
│   ├── category-routes.ts
│   ├── product-routes.ts
│   └── ...
├── controllers/           # Route controllers (business logic)
│   ├── user-controller.ts
│   ├── business-controller.ts
│   ├── product-controller.ts
│   └── ...
├── middlewares/          # Express middlewares
│   └── auth-middleware.ts
├── config/                # Configuration files
│   ├── db.ts
│   └── seed-reference-tables.ts
└── utils/                # Utility functions
    ├── main.ts
    └── transform-response.ts

prisma/
└── schema.prisma         # Database schema

dist/                     # Compiled JavaScript files
```

## API Documentation

- **Complete API Reference**: See `API_DOCUMENTATION.md`
- **Quick Start Guide**: See `QUICK_START.md`
- **Authentication Guide**: See `AUTHENTICATION_GUIDE.md`
- **Testing Examples**: See `API_TESTING_EXAMPLES.md`

## Key Features

### Unified User-Business Model
- One user account can manage multiple business profiles
- Each business can independently be a buyer, seller, or both
- Flexible role management via `can_buy` and `can_sell` flags

### Authentication
- JWT-based authentication
- 7-day token expiry
- Role-based access control (business_owner, admin)

### Product Management
- Hierarchical category system
- Multi-currency support
- Multiple price units (weight, volume, quantity, etc.)
- Product images management
- Search and filtering capabilities

### Order Management
- Complete order lifecycle tracking
- Order items with pricing details
- Payment and delivery status tracking

### RFQ System
- Request for Quotation (Inquiries)
- Quotation management
- Status tracking

### Reviews & Ratings
- Multi-aspect business reviews
- Review moderation system

## Available Endpoints

### Users (`/api/v1/users`)
- `POST /register` - Register user with business
- `POST /login` - User login
- `GET /` - Get all users (authenticated)
- `GET /:id` - Get user by ID (authenticated)
- `PUT /:id` - Update user (authenticated)
- `DELETE /:id` - Delete user (authenticated)

### Businesses (`/api/v1/businesses`)
- `GET /sellers` - Get all seller businesses (public)
- `POST /` - Create business (authenticated)
- `GET /` - Get all businesses (authenticated)
- `GET /:id` - Get business by ID (authenticated)
- `GET /user/:userId` - Get user's businesses (authenticated)
- `PUT /:id` - Update business (authenticated)
- `PUT /:id/role` - Update business roles (authenticated)
- `PUT /:id/verify` - Verify business (admin only)
- `DELETE /:id` - Delete business (authenticated)

### Products (`/api/v1/products`)
- `GET /` - Get all products (public, with filters)
- `GET /search` - Search products (public)
- `GET /:id` - Get product by ID (public)
- `POST /` - Create product (authenticated, seller/admin)
- `PUT /:id` - Update product (authenticated, seller/admin)
- `DELETE /:id` - Delete product (authenticated, seller/admin)

### Categories (`/api/v1/categories`)
- `GET /` - Get all categories (public)
- `GET /root` - Get root categories (public)
- `GET /:id` - Get category by ID (public)
- `POST /` - Create category (authenticated, admin)
- `PUT /:id` - Update category (authenticated, admin)
- `DELETE /:id` - Delete category (authenticated, admin)

See `API_DOCUMENTATION.md` for complete endpoint list.

## Scripts

- `npm run dev`: Start development server with hot-reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm test`: Run tests

## Database Commands

```bash
# View database in GUI
npx prisma studio

# Create new migration
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Response Format

All API responses use camelCase format to match frontend expectations. BigInt fields (IDs) are automatically converted to strings for JSON serialization.

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

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Build Tool**: tsup

## Security

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication
- CORS configuration for frontend
- Role-based access control
- Input validation

## License

[Add your license here]

## Support

For detailed documentation, see:
- `API_DOCUMENTATION.md` - Complete API reference
- `AUTHENTICATION_GUIDE.md` - Authentication and business management
- `QUICK_START.md` - Quick reference guide
- `API_TESTING_EXAMPLES.md` - Testing examples
