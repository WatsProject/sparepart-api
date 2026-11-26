import { stockTransactionsService } from "../services/stockTransactions.service.js";

export const stockTransactionsController = {
  async getAllTransactions(req, res, next) {
    try {
      const transactions = await stockTransactionsService.getAllTransactions();

      res.status(200).json({
        success: true,
        message: "Data transaksi stok berhasil diambil.",
        data: transactions,
      });
    } catch (err) {
      next(err);
    }
  },

  async getStockIn(req, res, next) {
    try {
      const transactions =
        await stockTransactionsService.getTransactionsByType("in");

      res.status(200).json({
        success: true,
        message: "Data barang masuk berhasil diambil.",
        data: transactions,
      });
    } catch (err) {
      next(err);
    }
  },

  async getStockOut(req, res, next) {
    try {
      const transactions =
        await stockTransactionsService.getTransactionsByType("out");

      res.status(200).json({
        success: true,
        message: "Data barang keluar berhasil diambil.",
        data: transactions,
      });
    } catch (err) {
      next(err);
    }
  },

  async getTransactionById(req, res, next) {
    try {
      const { id } = req.params;

      const transaction = await stockTransactionsService.getTransactionById(id);

      res.status(200).json({
        success: true,
        message: "Data transaksi stok berhasil diambil.",
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  async createTransaction(req, res, next) {
    try {
      const { date, type, sparepartId, supplierId, quantity, buyPrice, notes } =
        req.body;

      const userId = req.user.id;

      const transaction = await stockTransactionsService.createTransaction(
        date,
        type,
        sparepartId,
        supplierId,
        userId,
        quantity,
        buyPrice,
        notes,
      );

      res.status(201).json({
        success: true,
        message: "Transaksi stok berhasil ditambahkan.",
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateTransaction(req, res, next) {
    try {
      const { id } = req.params;

      const { date, type, sparepartId, supplierId, quantity, buyPrice, notes } =
        req.body;

      const userId = req.user.id;

      const transaction = await stockTransactionsService.updateTransaction(
        id,
        date,
        type,
        sparepartId,
        supplierId,
        userId,
        quantity,
        buyPrice,
        notes,
      );

      res.status(200).json({
        success: true,
        message: "Transaksi stok berhasil diperbarui.",
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteTransaction(req, res, next) {
    try {
      const { id } = req.params;

      const transaction = await stockTransactionsService.deleteTransaction(id);

      res.status(200).json({
        success: true,
        message: "Transaksi stok berhasil dihapus.",
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },
};
