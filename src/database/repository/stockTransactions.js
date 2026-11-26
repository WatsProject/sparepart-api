import { dB } from "../index.js";
import { lazyQuery } from "../lazy.js";
import { ConflictError } from "../../errors.js";

// Query yang dijalankan di dalam transaksi database.
// Semuanya lewat satu koneksi (conn), jadi tidak memakai lazyQuery.
const SQL_INSERT = `
  INSERT INTO stock_transactions (
    date, type, sparepart_id, supplier_id, user_id, quantity, buy_price, notes
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const SQL_UPDATE = `
  UPDATE stock_transactions
  SET
    date = ?,
    type = ?,
    sparepart_id = ?,
    supplier_id = ?,
    user_id = ?,
    quantity = ?,
    buy_price = ?,
    notes = ?
  WHERE id = ?
`;

const SQL_DELETE = `DELETE FROM stock_transactions WHERE id = ?`;

// FOR UPDATE mengunci baris ini sampai transaksi selesai
const SQL_AMBIL_UNTUK_UBAH = `SELECT * FROM stock_transactions WHERE id = ? FOR UPDATE`;

// Stok hanya berubah kalau hasilnya tidak minus
const SQL_UBAH_STOK = `
  UPDATE spareparts
  SET stock = stock + ?
  WHERE id = ? AND stock + ? >= 0
`;

class StockTransactionsRepository {
  // Query baca (tidak perlu transaksi)
  _findById = lazyQuery(`
    SELECT
      st.*,
      s.kode AS sparepart_kode,
      s.name AS sparepart_name,
      sp.name AS supplier_name,
      u.name AS user_name
    FROM stock_transactions st
    LEFT JOIN spareparts s ON st.sparepart_id = s.id
    LEFT JOIN suppliers sp ON st.supplier_id = sp.id
    LEFT JOIN users u ON st.user_id = u.id
    WHERE st.id = ?
  `);
  _getAllTransactions = lazyQuery(`
    SELECT
      st.*,
      s.kode AS sparepart_kode,
      s.name AS sparepart_name,
      sp.name AS supplier_name,
      u.name AS user_name
    FROM stock_transactions st
    LEFT JOIN spareparts s ON st.sparepart_id = s.id
    LEFT JOIN suppliers sp ON st.supplier_id = sp.id
    LEFT JOIN users u ON st.user_id = u.id
    ORDER BY st.id DESC
  `);
  _getTransactionsByType = lazyQuery(`
    SELECT
      st.*,
      s.kode AS sparepart_kode,
      s.name AS sparepart_name,
      sp.name AS supplier_name,
      u.name AS user_name
    FROM stock_transactions st
    LEFT JOIN spareparts s ON st.sparepart_id = s.id
    LEFT JOIN suppliers sp ON st.supplier_id = sp.id
    LEFT JOIN users u ON st.user_id = u.id
    WHERE st.type = ?
    ORDER BY st.id DESC
  `);

  // Method privat (awalan _): menjalankan "kerja" di dalam satu transaksi.
  // Kalau ada error di tengah jalan, semua perubahan dibatalkan (rollback).
  async _dalamTransaksi(kerja) {
    const conn = await dB.getConnection();

    try {
      await conn.beginTransaction();
      const hasil = await kerja(conn);
      await conn.commit();
      return hasil;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Method privat: mengubah stok sparepart sesuai transaksi.
  // arah = 1  -> terapkan efek transaksi (in: stok naik, out: stok turun)
  // arah = -1 -> batalkan efek transaksi (kebalikannya)
  async _ubahStok(conn, type, sparepartId, quantity, arah) {
    const perubahan = (type === "in" ? 1 : -1) * Number(quantity) * arah;

    const [result] = await conn.execute(SQL_UBAH_STOK, [
      perubahan,
      sparepartId,
      perubahan,
    ]);

    // Tidak ada baris yang berubah: sparepart tidak ada, atau stok jadi minus
    if (result.affectedRows === 0) {
      throw new ConflictError(
        "Sparepart tidak ditemukan atau stok tidak mencukupi",
      );
    }
  }

  async findById(id) {
    const [rows] = await this._findById(id);
    return rows[0] ?? null;
  }

  async getAllTransactions() {
    const [rows] = await this._getAllTransactions();
    return rows;
  }

  async getTransactionsByType(type) {
    const [rows] = await this._getTransactionsByType(type);
    return rows;
  }

  async createTransaction(
    date,
    type,
    sparepartId,
    supplierId = null,
    userId = null,
    quantity = 1,
    buyPrice = 0,
    notes = null,
  ) {
    return await this._dalamTransaksi(async (conn) => {
      // 1. Catat transaksinya
      const [result] = await conn.execute(SQL_INSERT, [
        date,
        type,
        sparepartId,
        supplierId,
        userId,
        quantity,
        buyPrice,
        notes,
      ]);

      // 2. Sesuaikan stok sparepart
      await this._ubahStok(conn, type, sparepartId, quantity, 1);

      return result.insertId;
    });
  }

  async updateTransaction(
    id,
    date,
    type,
    sparepartId,
    supplierId = null,
    userId = null,
    quantity = 1,
    buyPrice = 0,
    notes = null,
  ) {
    return await this._dalamTransaksi(async (conn) => {
      // 1. Ambil data lama (dikunci selama transaksi berjalan)
      const [rows] = await conn.execute(SQL_AMBIL_UNTUK_UBAH, [id]);
      const lama = rows[0];

      if (!lama) {
        return false;
      }

      // 2. Batalkan efek transaksi lama
      await this._ubahStok(
        conn,
        lama.type,
        lama.sparepart_id,
        lama.quantity,
        -1,
      );

      // 3. Simpan data baru
      await conn.execute(SQL_UPDATE, [
        date,
        type,
        sparepartId,
        supplierId,
        userId,
        quantity,
        buyPrice,
        notes,
        id,
      ]);

      // 4. Terapkan efek transaksi baru
      await this._ubahStok(conn, type, sparepartId, quantity, 1);

      return true;
    });
  }

  async deleteTransaction(id) {
    return await this._dalamTransaksi(async (conn) => {
      const [rows] = await conn.execute(SQL_AMBIL_UNTUK_UBAH, [id]);
      const lama = rows[0];

      if (!lama) {
        return false;
      }

      // Batalkan efek transaksi ke stok, lalu hapus catatannya
      await this._ubahStok(
        conn,
        lama.type,
        lama.sparepart_id,
        lama.quantity,
        -1,
      );
      await conn.execute(SQL_DELETE, [id]);

      return true;
    });
  }
}

export const stockTransactionsRepository = new StockTransactionsRepository();
