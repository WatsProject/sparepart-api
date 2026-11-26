import { lazyQuery } from "../lazy.js";

// Query dasar: data sparepart + nama kategori + nama supplier.
// LEFT JOIN dipakai supaya sparepart tanpa kategori/supplier tetap muncul
// (nama kategori/supplier-nya bernilai null).
const SELECT_DENGAN_NAMA = `
  SELECT
    s.*,
    c.name AS category_name,
    sup.name AS supplier_name
  FROM spareparts s
  LEFT JOIN categories c ON s.category_id = c.id
  LEFT JOIN suppliers sup ON s.supplier_id = sup.id
`;

class SparepartsRepository {
  _findById = lazyQuery(`${SELECT_DENGAN_NAMA} WHERE s.id = ?`);
  _findByKode = lazyQuery(
    `SELECT * FROM spareparts WHERE kode = ? ORDER BY id DESC`,
  );
  _findByName = lazyQuery(
    `${SELECT_DENGAN_NAMA} WHERE s.name LIKE ? ORDER BY s.id DESC`,
  );
  _createSparepart = lazyQuery(`
    INSERT INTO spareparts (
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
      description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  _updateSparepart = lazyQuery(`
    UPDATE spareparts
    SET
      kode = ?,
      name = ?,
      brand = ?,
      unit = ?,
      category_id = ?,
      supplier_id = ?,
      buy_price = ?,
      sell_price = ?,
      stock = ?,
      min_stock = ?,
      description = ?
    WHERE id = ?
  `);
  _deleteSparepart = lazyQuery(`DELETE FROM spareparts WHERE id = ?`);
  _getAllSpareparts = lazyQuery(`${SELECT_DENGAN_NAMA} ORDER BY s.id DESC`);

  async findById(id) {
    const [rows] = await this._findById(id);
    return rows[0] ?? null;
  }

  // Tetap tanpa JOIN: hanya dipakai untuk mengecek kode kembar
  async findByKode(kode) {
    const [rows] = await this._findByKode(kode);
    return rows[0] ?? null;
  }

  async findByName(name) {
    const [rows] = await this._findByName(`%${name}%`);
    return rows;
  }

  async createSparepart(
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
  ) {
    const [result] = await this._createSparepart(
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

    return result.insertId;
  }

  async updateSparepart(
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
  ) {
    const [result] = await this._updateSparepart(
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
      id,
    );

    return result.affectedRows > 0;
  }

  async deleteSparepart(id) {
    const [result] = await this._deleteSparepart(id);
    return result.affectedRows > 0;
  }

  async getAllSpareparts() {
    const [rows] = await this._getAllSpareparts();
    return rows;
  }
}

export const sparepartsRepository = new SparepartsRepository();
