import express, {Express, Request, Response} from 'express';
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
import client from './config/db';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app: Express = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// apply cors
app.use(cors());

app.get("/", (req: Request, res: Response) => {
    res.send("Airavat API Server is running!");
});

// API Routes
app.use("/api/v1/users", UserRoutes);
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
