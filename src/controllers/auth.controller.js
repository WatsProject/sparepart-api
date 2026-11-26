import { authService } from "../services/auth.service.js";

export const authController = {
  async register(req, res, next) {
    try {
      const { name, username, password, role } = req.body;

      const user = await authService.registerUser(
        name,
        username,
        password,
        role,
      );

      res.status(201).json({
        success: true,
        message: "User berhasil terdaftar.",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      const result = await authService.loginUser(username, password);

      res.status(200).json({
        success: true,
        message: "Login berhasil.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
