import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const AuthRouter = Router();

// Berubah: register hanya boleh dilakukan admin yang sudah login
AuthRouter.post(
  "/register",
  authMiddleware,
  roleMiddleware("admin"),
  authController.register,
);
AuthRouter.post("/login", authController.login);

export default AuthRouter;
