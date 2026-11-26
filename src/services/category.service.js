import { categoriesRepository } from "../database/repository/categories.js";
import { BadRequestError, NotFoundError } from "../errors.js";

export const categoryService = {
  async getAllCategories() {
    return await categoriesRepository.getAll();
  },

  async getCategoryById(id) {
    const category = await categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundError("Kategori tidak ditemukan");
    }

    return category;
  },

  async getCategoriesByName(name) {
    return await categoriesRepository.findByName(name);
  },

  async createCategory(name, description) {
    if (!name) {
      throw new BadRequestError("Nama kategori harus diisi");
    }

    const category = await categoriesRepository.create(name, description);

    return {
      id: category,
      name,
      description: description ?? null,
    };
  },

  async updateCategory(id, name, description) {
    const category = await categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundError("Kategori tidak ditemukan");
    }

    return await categoriesRepository.update(id, name, description);
  },

  async deleteCategory(id) {
    const category = await categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundError("Kategori tidak ditemukan");
    }

    return await categoriesRepository.delete(id);
  },
};
