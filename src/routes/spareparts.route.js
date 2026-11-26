import { Router } from "express";

import { sparepartsController } from "../controllers/spareparts.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const SparepartsRouter = Router();

SparepartsRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  sparepartsController.getAllSpareparts,
);
SparepartsRouter.get(
  "/search",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  sparepartsController.getSparepartsByName,
);
SparepartsRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  sparepartsController.getSparepartById,
);
SparepartsRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  sparepartsController.createSparepart,
);
SparepartsRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  sparepartsController.updateSparepart,
);
SparepartsRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  sparepartsController.deleteSparepart,
);

export default SparepartsRouter;
