import {PrismaClient} from '@prisma/client';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
dotenv.config();

const prisma = new PrismaClient();

function convertBigIntToString(value: any): any {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(convertBigIntToString);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const k of Object.keys(value)) {
      out[k] = convertBigIntToString((value as any)[k]);
    }
    return out;
  }
  return value;
}

export async function InsertSeller(req: Request, res: Response) {
  try {
    const newSeller = await prisma.seller.create({
      data: {
        company_name: "John's Store",
        contact_person: "John Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        is_verified: false,
        is_active: true,
      },
    });

    // Convert BigInt -> string for safe JSON serialization
    const safeSeller = convertBigIntToString(newSeller);

    return res.status(201).json({
      message: "Seller inserted successfully",
      seller: safeSeller,
    });
  } catch (err) {
    console.error("Error inserting seller:", err);
    return res.status(500).json({ error: "Failed to insert seller" });
  }
}


export async function GetAllSellers(req:Request, res:Response){
    try {
        const sellers = await prisma.seller.findMany();
        const safeSellers = convertBigIntToString(sellers);
        res.json({ message: "Fetched all sellers successfully", sellers: safeSellers });
    } catch (err) {
        console.error("Error fetching sellers:", err);
        res.status(500).json({ error: "Failed to fetch sellers" });
    }
}
