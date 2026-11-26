import { userService } from "../services/user.service.js";

export const userController = {
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();

      res.status(200).json({
        success: true,
        message: "Data user berhasil diambil.",
        data: users,
      });
    } catch (err) {
      next(err);
    }
  },

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        message: "Data user berhasil diambil.",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, username, password, role } = req.body;

      const updated = await userService.updateUser(
        id,
        name,
        username,
        password,
        role,
      );

      res.status(200).json({
        success: true,
        message: "User berhasil diperbarui.",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const deleted = await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: "User berhasil dihapus.",
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  },
};
