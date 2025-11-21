import { Router } from "express";
import { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  searchProducts 
} from "../controllers/product-controller";
import { authenticateToken, isSellerOrAdmin } from "../middlewares/auth-middleware";

const router = Router();

// Public routes (no authentication required)
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/:id", getProductById);

// Protected routes (authentication required)
router.post("/", authenticateToken, isSellerOrAdmin, createProduct);
router.put("/:id", authenticateToken, isSellerOrAdmin, updateProduct);
router.delete("/:id", authenticateToken, isSellerOrAdmin, deleteProduct);

export default router;
