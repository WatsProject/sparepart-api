import { sparepartsService } from "../services/spareparts.service.js";

export const sparepartsController = {
  async getAllSpareparts(req, res, next) {
    try {
      const spareparts = await sparepartsService.getAllSpareparts();

      res.status(200).json({
        success: true,
        message: "Data sparepart berhasil diambil.",
        data: spareparts,
      });
    } catch (err) {
      next(err);
    }
  },

  async getSparepartById(req, res, next) {
    try {
      const { id } = req.params;

      const sparepart = await sparepartsService.getSparepartById(id);

      res.status(200).json({
        success: true,
        message: "Data sparepart berhasil diambil.",
        data: sparepart,
      });
    } catch (err) {
      next(err);
    }
  },

  async getSparepartsByName(req, res, next) {
    try {
      const { name } = req.query;

      const spareparts = await sparepartsService.getSparepartsByName(name);

      res.status(200).json({
        success: true,
        message: "Data sparepart berhasil dicari.",
        data: spareparts,
      });
    } catch (err) {
      next(err);
    }
  },

  async createSparepart(req, res, next) {
    try {
      const {
        kode,
        name,
        brand,
        unit,
        category_id,
        supplier_id,
        buy_price,
        sell_price,
        stock,
        min_stock,
        description,
      } = req.body;

      const sparepart = await sparepartsService.createSparepart(
        kode,
        name,
        brand,
        unit,
        category_id,
        supplier_id,
        buy_price,
        sell_price,
        stock,
        min_stock,
        description,
      );

      res.status(201).json({
        success: true,
        message: "Sparepart berhasil ditambahkan.",
        data: sparepart,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSparepart(req, res, next) {
    try {
      const { id } = req.params;

      const {
        kode,
        name,
        brand,
        unit,
        category_id,
        supplier_id,
        buy_price,
        sell_price,
        stock,
        min_stock,
        description,
      } = req.body;

      const sparepart = await sparepartsService.updateSparepart(
        id,
        kode,
        name,
        brand,
        unit,
        category_id,
        supplier_id,
        buy_price,
        sell_price,
        stock,
        min_stock,
        description,
      );

      res.status(200).json({
        success: true,
        message: "Sparepart berhasil diperbarui.",
        data: sparepart,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteSparepart(req, res, next) {
    try {
      const { id } = req.params;

      await sparepartsService.deleteSparepart(id);

      res.status(200).json({
        success: true,
        message: "Sparepart berhasil dihapus.",
      });
    } catch (err) {
      next(err);
    }
  },
};
