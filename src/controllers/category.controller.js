import { categoryService } from "../services/category.service.js";

export const categoryController = {
  async getAllCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();

      res.status(200).json({
        success: true,
        message: "Data kategori berhasil diambil.",
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },

  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;

      const category = await categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        message: "Data kategori berhasil diambil.",
        data: category,
      });
    } catch (err) {
      next(err);
    }
  },

  async getCategoriesByName(req, res, next) {
    try {
      const { name } = req.query;

      const categories = await categoryService.getCategoriesByName(name);

      res.status(200).json({
        success: true,
        message: "Data kategori berhasil diambil.",
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name, description } = req.body;

      const category = await categoryService.createCategory(name, description);

      res.status(201).json({
        success: true,
        message: "Kategori berhasil dibuat.",
        data: category,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const updated = await categoryService.updateCategory(
        id,
        name,
        description,
      );

      res.status(200).json({
        success: true,
        message: "Kategori berhasil diperbarui.",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const deleted = await categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: "Kategori berhasil dihapus.",
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  },
};
