import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';

const prisma = new PrismaClient();

// Create Business (Add additional business to existing user)
export async function createBusiness(req: Request, res: Response) {
  try {
    const { 
      user_id,
      business_name, 
      business_type_id,
      can_buy,
      can_sell,
      gst_number,
      pan_number,
      msme_number,
      description, 
      license_number, 
      tax_number,
      website_url,
      employee_count,
      year_established,
      is_verified,
      address_line1,
      address_line2,
      city,
      state,
      country,
      pincode,
      primary_contact_phone,
      primary_contact_email
    } = req.body;

    if (!user_id || !business_name) {
      return res.status(400).json({ error: "Missing required fields: user_id, business_name" });
    }

    // At least one role must be selected
    if (!can_buy && !can_sell) {
      return res.status(400).json({ 
        error: "Business must have at least one role: buyer or seller" 
      });
    }

    // Verify user exists
    const user = await prisma.users.findUnique({
      where: { user_id: BigInt(user_id) }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newBusiness = await prisma.business.create({
      data: {
        user_id: BigInt(user_id),
        business_name,
        business_type_id: business_type_id ? BigInt(business_type_id) : null,
        can_buy: can_buy || true,
        can_sell: can_sell || false,
        gst_number,
        pan_number,
        msme_number,
        description,
        license_number,
        tax_number,
        website_url,
        employee_count,
        year_established,
        is_verified: is_verified || false,
        address_line1,
        address_line2,
        city,
        state,
        country: country || 'India',
        pincode,
        primary_contact_phone,
        primary_contact_email,
      },
    });

    const safeBusiness = convertBigIntToString(newBusiness);
    return res.status(201).json({
      message: "Business created successfully",
      business: safeBusiness,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to create business" });
  }
}

// Get All Businesses
export async function getAllBusinesses(req: Request, res: Response) {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        business_type: true,
      }
    });
    const safeBusinesses = convertBigIntToString(businesses);
    res.json({ message: "Fetched all businesses successfully", businesses: safeBusinesses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch businesses" });
  }
}

// Get Business by ID
export async function getBusinessById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const business = await prisma.business.findUnique({
      where: { business_id: BigInt(id) },
      include: {
        business_type: true,
      }
    });

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const safeBusiness = convertBigIntToString(business);
    res.json({ message: "Business fetched successfully", business: safeBusiness });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch business" });
  }
}

// Update Business
export async function updateBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedBusiness = await prisma.business.update({
      where: { business_id: BigInt(id) },
      data: updateData,
    });

    const safeBusiness = convertBigIntToString(updatedBusiness);
    res.json({ message: "Business updated successfully", business: safeBusiness });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update business" });
  }
}

// Delete Business
export async function deleteBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.business.delete({
      where: { business_id: BigInt(id) },
    });

    res.json({ message: "Business deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete business" });
  }
}

// Get Businesses by User ID
export async function getBusinessesByUserId(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    const businesses = await prisma.business.findMany({
      where: { user_id: BigInt(userId) },
      include: {
        business_type: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const safeBusinesses = convertBigIntToString(businesses);
    res.json({ 
      message: "Fetched user businesses successfully", 
      businesses: safeBusinesses 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch businesses" });
  }
}

// Get Seller Businesses (can_sell = true)
export async function getSellerBusinesses(req: Request, res: Response) {
  try {
    const businesses = await prisma.business.findMany({
      where: { can_sell: true },
      include: {
        business_type: true,
        products: {
          where: { status: 'active' },
          take: 5
        }
      }
    });

    const safeBusinesses = convertBigIntToString(businesses);
    res.json({ 
      message: "Fetched seller businesses successfully", 
      businesses: safeBusinesses 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch seller businesses" });
  }
}

// Update Business Role (Enable/Disable Buyer or Seller capabilities)
export async function updateBusinessRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { can_buy, can_sell } = req.body;

    // At least one role must be enabled
    if (!can_buy && !can_sell) {
      return res.status(400).json({ 
        error: "Business must have at least one role enabled" 
      });
    }

    const updatedBusiness = await prisma.business.update({
      where: { business_id: BigInt(id) },
      data: {
        can_buy,
        can_sell
      },
    });

    const safeBusiness = convertBigIntToString(updatedBusiness);
    res.json({ 
      message: "Business role updated successfully", 
      business: safeBusiness 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update business role" });
  }
}

// Verify Business (Admin only)
export async function verifyBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { verification_level, verified_by } = req.body;

    const updatedBusiness = await prisma.business.update({
      where: { business_id: BigInt(id) },
      data: {
        is_verified: true,
        verification_level: verification_level || 'basic',
        verified_at: new Date(),
        verified_by: verified_by ? BigInt(verified_by) : null,
      },
    });

    const safeBusiness = convertBigIntToString(updatedBusiness);
    res.json({ 
      message: "Business verified successfully", 
      business: safeBusiness 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to verify business" });
  }
}
