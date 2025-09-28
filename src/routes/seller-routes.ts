import { Router } from "express";
import { GetAllSellers, InsertSeller  } from "../controllers/user-controllers";

const router = Router();

router.get("/all", GetAllSellers);
router.post("/", InsertSeller);


export default router;
