import { Router } from "express";
import { categoryController } from "../controllers/category.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const CategoryRouter = Router();

CategoryRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  categoryController.getAllCategories,
);
CategoryRouter.get(
  "/search",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  categoryController.getCategoriesByName,
);
CategoryRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  categoryController.getCategoryById,
);
CategoryRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  categoryController.createCategory,
);
CategoryRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  categoryController.updateCategory,
);
CategoryRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  categoryController.deleteCategory,
);

export default CategoryRouter;
