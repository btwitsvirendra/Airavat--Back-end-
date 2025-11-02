import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';
import {sign} from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Register User with Business Profile
export async function registerUser(req: Request, res: Response) {
  try {
    const { 
      // User details
      email, 
      password,
      full_name,
      phone,
      
      // Business details
      business_name,
      business_type_id,
      can_buy,
      can_sell,
      gst_number,
      pan_number,
      msme_number,
      description,
      address_line1,
      city,
      state,
      country,
      pincode
    } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !business_name || !phone) {
      return res.status(400).json({ 
        error: "Missing required fields: email, password, full_name, business_name, phone" 
      });
    }

    // At least one role must be selected
    if (!can_buy && !can_sell) {
      return res.status(400).json({ 
        error: "Business must have at least one role: buyer or seller" 
      });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and business in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.users.create({
        data: {
          email,
          password_hash: hashedPassword,
          full_name,
          phone,
          role: 'business_owner',
          is_verified: false,
          status: 'active',
          email_verified: false,
        },
      });

      // Create business profile
      const newBusiness = await tx.business.create({
        data: {
          user_id: newUser.user_id,
          business_name,
          business_type_id: business_type_id ? BigInt(business_type_id) : null,
          can_buy: can_buy || true,
          can_sell: can_sell || false,
          gst_number,
          pan_number,
          msme_number,
          description,
          address_line1,
          city,
          state,
          country: country || 'India',
          pincode,
        },
      });

      return { user: newUser, business: newBusiness };
    });

    const safeResult = convertBigIntToString(result);
    return res.status(201).json({
      message: "User and business registered successfully",
      user: {
        user_id: safeResult.user.user_id,
        email: safeResult.user.email,
        full_name: safeResult.user.full_name,
        phone: safeResult.user.phone,
      },
      business: safeResult.business,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to register user" });
  }
}

// Create User (Admin only - for direct user creation)
export async function createUser(req: Request, res: Response) {
  try {
    const { 
      email, 
      password, 
      full_name,
      phone,
      role,
      is_verified,
      status,
      email_verified,
    } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "Missing required fields: email, password, full_name" });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        email,
        password_hash: hashedPassword,
        full_name,
        phone,
        role: role || 'business_owner',
        is_verified: is_verified || false,
        status: status || 'active',
        email_verified: email_verified || false,
      },
    });

    const safeUser = convertBigIntToString(newUser);
    return res.status(201).json({
      message: "User created successfully",
      user: safeUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to create user" });
  }
}

// Get All Users
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await prisma.users.findMany({
      select: {
        user_id: true
      }
    });
    const safeUsers = convertBigIntToString(users);
    res.json({ message: "Fetched all users successfully", users: safeUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
}

// Get User by ID
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({
      where: { user_id: BigInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const safeUser = convertBigIntToString(user);
    res.json({ message: "User fetched successfully", user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch user" });
  }
}

// Update User
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If password is being updated, hash it
    if (updateData.password_hash) {
      updateData.password_hash = await bcrypt.hash(updateData.password_hash, 10);
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: BigInt(id) },
      data: updateData
    });

    const safeUser = convertBigIntToString(updatedUser);
    res.json({ message: "User updated successfully", user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
}

// Delete User
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.users.delete({
      where: { user_id: BigInt(id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete user" });
  }
}

// User Login with Business Data
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        businesses: {
          include: {
            business_type: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() },
    });

    const safeUser = convertBigIntToString({
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      is_verified: user.is_verified,
      status: user.status,
      businesses: user.businesses,
    });

    const token = sign(
      { 
        userId: user.user_id.toString(), 
        role: user.role,
        email: user.email 
      }, 
      process.env.JWT_SECRET || 'your_jwt_secret', 
      { expiresIn: '7d' }
    );

    res.json({ 
      message: "Login successful", 
      user: safeUser, 
      token 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
}
