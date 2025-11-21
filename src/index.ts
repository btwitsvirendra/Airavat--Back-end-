import express, {Express, Request, Response} from 'express';
import { createServer } from 'http';
import UserRoutes from './routes/user-routes';
import BusinessRoutes from './routes/business-routes';
import CategoryRoutes from './routes/category-routes';
import ProductRoutes from './routes/product-routes';
import ProductImageRoutes from './routes/product-image-routes';
import OrderRoutes from './routes/order-routes';
import OrderItemRoutes from './routes/order-item-routes';
import ReviewRoutes from './routes/review-routes';
import InquiryRoutes from './routes/inquiry-routes';
import QuotationRoutes from './routes/quotation-routes';
import CurrencyRoutes from './routes/currency-routes';
import PriceUnitRoutes from './routes/price-unit-routes';
import ChatRoutes from './routes/chat-routes';
import NotificationRoutes from './routes/notification-routes';
import PaymentLinkRoutes from './routes/payment-link-routes';
import CartRoutes from './routes/cart-routes';
import InvoiceRoutes from './routes/invoice-routes';
import client from './config/db';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupSocketServer } from './config/socket-server';
import { apiLimiter, authLimiter } from './middlewares/rate-limit';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Backend runs on port 3000, Frontend on 3001
const port = process.env.PORT || 3000;

// Setup Socket.io for real-time chat
const io = setupSocketServer(httpServer);

// Make io available to routes if needed
app.set('io', io);
app.locals.io = io; // Also make available via app.locals

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration for Airavat frontend
// Frontend runs on port 3001, Backend on port 3000
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply general rate limiting
app.use('/api/v1', apiLimiter);

app.get("/", (req: Request, res: Response) => {
    res.send("Airavat API Server is running!");
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.use("/api/v1/users", authLimiter, UserRoutes);
app.use("/api/v1/businesses", BusinessRoutes);
app.use("/api/v1/categories", CategoryRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/product-images", ProductImageRoutes);
app.use("/api/v1/orders", OrderRoutes);
app.use("/api/v1/order-items", OrderItemRoutes);
app.use("/api/v1/reviews", ReviewRoutes);
app.use("/api/v1/inquiries", InquiryRoutes);
app.use("/api/v1/quotations", QuotationRoutes);
app.use("/api/v1/currencies", CurrencyRoutes);
app.use("/api/v1/price-units", PriceUnitRoutes);
app.use("/api/v1/chat", ChatRoutes);
app.use("/api/v1/notifications", NotificationRoutes);
app.use("/api/v1/payment-links", PaymentLinkRoutes);
app.use("/api/v1/cart", CartRoutes);
app.use("/api/v1/invoices", InvoiceRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

httpServer.listen(port, () => {
    console.log(`🚀 Airavat API Server is running on http://localhost:${port}`);
    console.log(`📡 Socket.io server is ready for real-time connections`);
    console.log(`📚 API Base URL: http://localhost:${port}/api/v1`);
});
