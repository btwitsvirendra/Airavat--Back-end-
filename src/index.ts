import express, {Express, Request, Response} from 'express';
import client from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();

const port = process.env.PORT || 3000;

app.get('/',async (req: Request, res: Response) => {

    try {
        const result = await client.query('SELECT * FROM sellers;');
        res.json({
            success: true,
            data: result.rows
        })
    } catch (error: any) {
        res.json({
            success: false,
            error: error.message
        })
    }
});

app.get("/something", (req: Request, res: Response) => {
    res.send("This is something else!");
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});