import { Router } from "express";
import { 
  registerUser,
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  loginUser 
} from "../controllers/user-controller";
import { authenticateToken, isAdmin } from "../middlewares/auth-middleware";

const router = Router();

// Public routes
router.post("/register", registerUser); // User registration with business
router.post("/login", loginUser);

// Protected routes (require authentication)
router.get("/", authenticateToken, getAllUsers);
router.get("/:id", authenticateToken, getUserById);
router.put("/:id", authenticateToken, updateUser);
router.delete("/:id", authenticateToken, deleteUser);

// Admin only routes
router.post("/create", authenticateToken, isAdmin, createUser); // Direct user creation by admin

export default router;
