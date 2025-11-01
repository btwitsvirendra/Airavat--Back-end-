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

router.use(authenticateToken, isAdmin);

// Category routes
router.post("/", createCategory);
router.get("/", getAllCategories);
router.get("/root", getRootCategories);
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
