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

router.use(authenticateToken, isSellerOrAdmin);

// Product routes
router.post("/", createProduct);
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
