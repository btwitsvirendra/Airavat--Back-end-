import { Router } from "express";
import { 
  createCategory, 
  getAllCategories, 
  getCategoryById, 
  getRootCategories,
  updateCategory, 
  deleteCategory 
} from "../controllers/category-controller";
import { authenticateToken, isAdmin } from "../middlewares/auth-middleware";

const router = Router();

// Public routes (no authentication required)
router.get("/", getAllCategories);
router.get("/root", getRootCategories);
router.get("/:id", getCategoryById);

// Protected routes (authentication required)
router.post("/", authenticateToken, isAdmin, createCategory);
router.put("/:id", authenticateToken, isAdmin, updateCategory);
router.delete("/:id", authenticateToken, isAdmin, deleteCategory);

export default router;
