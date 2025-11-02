import { Router } from "express";
import { 
  createBusiness, 
  getAllBusinesses, 
  getBusinessById,
  getBusinessesByUserId,
  getSellerBusinesses,
  updateBusiness,
  updateBusinessRole,
  verifyBusiness,
  deleteBusiness 
} from "../controllers/business-controller";
import { authenticateToken, isAdmin } from "../middlewares/auth-middleware";

const router = Router();

// Public routes
router.get("/sellers", getSellerBusinesses); // Get all seller businesses

// Protected routes (require authentication)
router.post("/", authenticateToken, createBusiness); // Create new business
router.get("/", authenticateToken, getAllBusinesses); // Get all businesses
router.get("/:id", authenticateToken, getBusinessById); // Get business by ID
router.get("/user/:userId", authenticateToken, getBusinessesByUserId); // Get user's businesses
router.put("/:id", authenticateToken, updateBusiness); // Update business
router.put("/:id/role", authenticateToken, updateBusinessRole); // Update business roles
router.delete("/:id", authenticateToken, deleteBusiness); // Delete business

// Admin only routes
router.put("/:id/verify", authenticateToken, isAdmin, verifyBusiness); // Verify business

export default router;
