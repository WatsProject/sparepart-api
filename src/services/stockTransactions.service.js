import { stockTransactionsRepository } from "../database/repository/stockTransactions.js";
import { sparepartsRepository } from "../database/repository/spareparts.js";
import { suppliersRepository } from "../database/repository/suppliers.js";
import { BadRequestError, ConflictError, NotFoundError } from "../errors.js";

const ALLOWED_TYPES = ["in", "out"];

export const stockTransactionsService = {
  async getAllTransactions() {
    return await stockTransactionsRepository.getAllTransactions();
  },

  async getTransactionsByType(type) {
    if (!ALLOWED_TYPES.includes(type)) {
      throw new BadRequestError("Tipe transaksi tidak valid");
    }

    return await stockTransactionsRepository.getTransactionsByType(type);
  },

  async getTransactionById(id) {
    const transaction = await stockTransactionsRepository.findById(id);

    if (!transaction) {
      throw new NotFoundError("Transaksi stok tidak ditemukan");
    }

    return transaction;
  },

  async createTransaction(
    date,
    type,
    sparepartId,
    supplierId,
    userId,
    quantity = 1,
    buyPrice = 0,
    notes = null,
  ) {
    if (!date) {
      throw new BadRequestError("Tanggal harus diisi");
    }

    if (!ALLOWED_TYPES.includes(type)) {
      throw new BadRequestError("Tipe transaksi harus 'in' atau 'out'");
    }

    if (!sparepartId) {
      throw new BadRequestError("Sparepart harus dipilih");
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestError("Jumlah harus lebih dari 0");
    }

    if (buyPrice < 0) {
      throw new BadRequestError("Harga beli tidak boleh kurang dari 0");
    }

    const sparepart = await sparepartsRepository.findById(sparepartId);

    if (!sparepart) {
      throw new NotFoundError("Sparepart tidak ditemukan");
    }

    if (type === "in") {
      if (!supplierId) {
        throw new BadRequestError("Supplier harus dipilih untuk barang masuk");
      }

      const supplier = await suppliersRepository.findById(supplierId);

      if (!supplier) {
        throw new NotFoundError("Supplier tidak ditemukan");
      }
    }

    if (type === "out") {
      supplierId = null;
      buyPrice = 0;

      if (sparepart.stock < quantity) {
        throw new ConflictError(
          `Stok ${sparepart.name} tidak mencukupi. Stok tersedia: ${sparepart.stock}`,
        );
      }
    }

    const transactionId = await stockTransactionsRepository.createTransaction(
      date,
      type,
      sparepartId,
      supplierId,
      userId,
      quantity,
      buyPrice,
      notes,
    );

    return await this.getTransactionById(transactionId);
  },

  async updateTransaction(
    id,
    date,
    type,
    sparepartId,
    supplierId,
    userId,
    quantity = 1,
    buyPrice = 0,
    notes = null,
  ) {
    if (!date) {
      throw new BadRequestError("Tanggal harus diisi");
    }

    if (!ALLOWED_TYPES.includes(type)) {
      throw new BadRequestError("Tipe transaksi harus 'in' atau 'out'");
    }

    if (!sparepartId) {
      throw new BadRequestError("Sparepart harus dipilih");
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestError("Jumlah harus lebih dari 0");
    }

    if (buyPrice < 0) {
      throw new BadRequestError("Harga beli tidak boleh kurang dari 0");
    }

    const sparepart = await sparepartsRepository.findById(sparepartId);

    if (!sparepart) {
      throw new NotFoundError("Sparepart tidak ditemukan");
    }

    if (type === "in") {
      if (!supplierId) {
        throw new BadRequestError("Supplier harus dipilih untuk barang masuk");
      }

      const supplier = await suppliersRepository.findById(supplierId);

      if (!supplier) {
        throw new NotFoundError("Supplier tidak ditemukan");
      }
    }

    if (type === "out") {
      supplierId = null;
      buyPrice = 0;
    }

    const updated = await stockTransactionsRepository.updateTransaction(
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

    // Repository mengembalikan false kalau transaksinya tidak ada
    if (!updated) {
      throw new NotFoundError("Transaksi stok tidak ditemukan");
    }

    return await this.getTransactionById(id);
  },

  async deleteTransaction(id) {
    const transaction = await this.getTransactionById(id);

    const deleted = await stockTransactionsRepository.deleteTransaction(id);

    if (!deleted) {
      throw new NotFoundError("Transaksi stok tidak ditemukan");
    }

    return {
      id: transaction.id,
      type: transaction.type,
      sparepart_id: transaction.sparepart_id,
    };
  },
};
