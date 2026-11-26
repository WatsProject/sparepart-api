import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { selfOrAdminMiddleware } from "../middleware/selfOrAdmin.middleware.js";

const UserRouter = Router();

UserRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  userController.getAllUsers,
);
UserRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userController.getUserById,
);
UserRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  selfOrAdminMiddleware, // baru
  userController.updateUser,
);
UserRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userController.deleteUser,
);

export default UserRouter;
