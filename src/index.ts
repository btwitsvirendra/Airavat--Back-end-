import express, {Express, Request, Response} from 'express';
import SellerRoutes from './routes/seller-routes';
import client from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();

const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("This is something else!");
});

app.use("/api/v1/sellers", SellerRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});