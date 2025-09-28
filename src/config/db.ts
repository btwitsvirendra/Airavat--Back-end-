import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
 
// const client = new Client({
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
//   database: process.env.DB_NAME || 'alladinnow',
//   user: process.env.DB_USER || 'postgres',
//   password: process.env.DB_PASSWORD || 'jaishreeram',
// })

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

client.connect()
.then(() => {
    console.log('Connected to PostgreSQL database');
})
.catch(err => {
    console.error('Connection error', err.stack);
});

export default client;