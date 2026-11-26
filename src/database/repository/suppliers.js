import { lazyQuery } from "../lazy.js";

class SuppliersRepository {
  _findById = lazyQuery(`SELECT * FROM suppliers WHERE id = ?`);
  _findByName = lazyQuery(
    `SELECT * FROM suppliers WHERE name LIKE ? ORDER BY name ASC`,
  );
  _create = lazyQuery(
    `INSERT INTO suppliers (name, address, phone, contact) VALUES (?, ?, ?, ?)`,
  );
  _update = lazyQuery(
    `UPDATE suppliers
     SET name = ?, address = ?, phone = ?, contact = ?
     WHERE id = ?`,
  );
  _delete = lazyQuery(`DELETE FROM suppliers WHERE id = ?`);
  _getAll = lazyQuery(`SELECT * FROM suppliers ORDER BY id DESC`);

  async findById(id) {
    const [rows] = await this._findById(id);
    return rows[0] ?? null;
  }

  async findByName(name) {
    const [rows] = await this._findByName(`%${name}%`);
    return rows;
  }

  async create(name, address, phone, contact) {
    const [result] = await this._create(name, address, phone, contact);

    return result.insertId;
  }

  async update(id, name, address, phone, contact) {
    const [result] = await this._update(name, address, phone, contact, id);

    return result.affectedRows > 0;
  }

  async delete(id) {
    const [result] = await this._delete(id);
    return result.affectedRows > 0;
  }

  async getAll() {
    const [rows] = await this._getAll();
    return rows;
  }
}

export const suppliersRepository = new SuppliersRepository();
