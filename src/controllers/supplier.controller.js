import { supplierService } from "../services/supplier.service.js";

export const supplierController = {
  async getAllSuppliers(req, res, next) {
    try {
      const suppliers = await supplierService.getAllSuppliers();

      res.status(200).json({
        success: true,
        message: "Data supplier berhasil diambil.",
        data: suppliers,
      });
    } catch (err) {
      next(err);
    }
  },

  async getSupplierById(req, res, next) {
    try {
      const { id } = req.params;

      const supplier = await supplierService.getSupplierById(id);

      res.status(200).json({
        success: true,
        message: "Data supplier berhasil diambil.",
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  },

  async getSuppliersByName(req, res, next) {
    try {
      const { name } = req.query;

      const suppliers = await supplierService.getSuppliersByName(name);

      res.status(200).json({
        success: true,
        message: "Data supplier berhasil diambil.",
        data: suppliers,
      });
    } catch (err) {
      next(err);
    }
  },

  async createSupplier(req, res, next) {
    try {
      const { name, address, phone, contact } = req.body;

      const supplier = await supplierService.createSupplier(
        name,
        address,
        phone,
        contact,
      );

      res.status(201).json({
        success: true,
        message: "Supplier berhasil dibuat.",
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;

      const { name, address, phone, contact } = req.body;

      const updated = await supplierService.updateSupplier(
        id,
        name,
        address,
        phone,
        contact,
      );

      res.status(200).json({
        success: true,
        message: "Supplier berhasil diperbarui.",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params;

      const deleted = await supplierService.deleteSupplier(id);

      res.status(200).json({
        success: true,
        message: "Supplier berhasil dihapus.",
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  },
};
