# 🚀 Start Here - Testing Airavat Backend

## Quick Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
cd C:\Users\iamvi\Documents\GitHub\alladinnow-nodejs-server
npm install
```

### Step 2: Create .env File
Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/airavat"
PORT=3000
JWT_SECRET=airavat-super-secret-jwt-key-change-in-production-min-32-chars
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Important:** Replace `user`, `password`, and `airavat` with your actual PostgreSQL credentials.

### Step 3: Run Database Migration
```bash
npx prisma generate
npx prisma migrate dev --name add_chat_and_notifications
```

### Step 4: Start Backend Server
```bash
npm run dev
```

You should see:
```
🚀 Airavat API Server is running on http://localhost:3000
📡 Socket.io server is ready for real-time connections
📚 API Base URL: http://localhost:3000/api/v1
```

---

## ✅ Verify Backend is Working

### Test 1: Health Check
Open browser or use curl:
```
http://localhost:3000/health
```

Expected: `{"status":"healthy",...}`

### Test 2: API Status
```
http://localhost:3000/
```

Expected: `Airavat API Server is running!`

---

## 🔌 Connect Frontend to Backend

### Update Frontend API Configuration

In your Airavat frontend, make sure the API base URL is set to:
```
http://localhost:3000/api/v1
```

And Socket.io server URL:
```
http://localhost:3000
```

---

## 🧪 Test Complete Flow

### 1. Register a User
```bash
POST http://localhost:3000/api/v1/users/register
{
  "email": "test@test.com",
  "password": "Test123!",
  "full_name": "Test User",
  "phone": "+91 9876543210",
  "business_name": "Test Business",
  "can_buy": true,
  "can_sell": true
}
```

### 2. Login
```bash
POST http://localhost:3000/api/v1/users/login
{
  "email": "test@test.com",
  "password": "Test123!"
}
```

### 3. Test Chat (after creating products and conversations)

---

## 📋 Checklist Before Testing

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct values
- [ ] Database migration run successfully
- [ ] Backend server starts without errors
- [ ] Health check endpoint works
- [ ] Frontend API URL configured correctly

---

## 🐛 Common Issues

### "Cannot find module"
→ Run `npm install`

### "Migration failed"
→ Check DATABASE_URL in .env
→ Ensure PostgreSQL is running

### "Port 3000 already in use"
→ Change PORT in .env or stop other process

### "Socket.io connection failed"
→ Check CORS configuration
→ Verify FRONTEND_URL in .env matches frontend URL

---

## 📚 Full Documentation

- `TESTING_GUIDE.md` - Complete testing instructions
- `QUICK_TEST.md` - Quick test commands
- `FEATURES_IMPLEMENTATION.md` - Feature documentation
- `SECURITY_RECOMMENDATIONS.md` - Security guide

---

**Ready to test!** Follow the steps above to get started. 🎉

