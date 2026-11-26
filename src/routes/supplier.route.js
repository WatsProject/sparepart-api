import { Router } from "express";
import { supplierController } from "../controllers/supplier.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const SupplierRouter = Router();

SupplierRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  supplierController.getAllSuppliers,
);
SupplierRouter.get(
  "/search",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  supplierController.getSuppliersByName,
);
SupplierRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  supplierController.getSupplierById,
);
SupplierRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  supplierController.createSupplier,
);
SupplierRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  supplierController.updateSupplier,
);
SupplierRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  supplierController.deleteSupplier,
);

export default SupplierRouter;
