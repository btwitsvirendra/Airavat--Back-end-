import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';
import {sign} from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Create User
export async function createUser(req: Request, res: Response) {
  try {
    const { 
      email, 
      password, 
      role, 
      is_verified,
      status,
      email_verified,
      last_login,
      created_at
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
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
        role,
        is_verified: is_verified || false,
        status: status || 'active',
        email_verified: email_verified || false,
        last_login: last_login || null,
        created_at: created_at || new Date(),
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

// User Login
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.users.findUnique({
      where: { email },
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
      role: user.role,
      is_verified: user.is_verified,
      status: user.status,
    });

    const token = sign({ userId: user.user_id.toString(), role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    res.json({ message: "Login successful", user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
}
