import { suppliersRepository } from "../database/repository/suppliers.js";
import { BadRequestError, NotFoundError } from "../errors.js";

export const supplierService = {
  async getAllSuppliers() {
    return await suppliersRepository.getAll();
  },

  async getSupplierById(id) {
    const supplier = await suppliersRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError("Supplier tidak ditemukan");
    }

    return supplier;
  },

  async getSuppliersByName(name) {
    return await suppliersRepository.findByName(name);
  },

  async createSupplier(name, address = null, phone = null, contact = null) {
    if (!name) {
      throw new BadRequestError("Nama supplier harus diisi");
    }

    const supplier = await suppliersRepository.create(
      name,
      address,
      phone,
      contact,
    );

    return {
      id: supplier,
      name,
      address,
      phone,
      contact,
    };
  },

  async updateSupplier(id, name, address = null, phone = null, contact = null) {
    const supplier = await suppliersRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError("Supplier tidak ditemukan");
    }

    return await suppliersRepository.update(id, name, address, phone, contact);
  },

  async deleteSupplier(id) {
    const supplier = await suppliersRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError("Supplier tidak ditemukan");
    }

    return await suppliersRepository.delete(id);
  },
};
