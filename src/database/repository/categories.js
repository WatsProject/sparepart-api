import { lazyQuery } from "../lazy.js";

class CategoriesRepository {
  _findById = lazyQuery(`SELECT * FROM categories WHERE id = ?`);
  _findByName = lazyQuery(
    `SELECT * FROM categories WHERE name LIKE ? ORDER BY name ASC`,
  );
  _create = lazyQuery(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
  );
  _update = lazyQuery(
    `UPDATE categories SET name = ?, description = ? WHERE id = ?`,
  );
  _delete = lazyQuery(`DELETE FROM categories WHERE id = ?`);
  _getAll = lazyQuery(`SELECT * FROM categories ORDER BY id DESC`);

  async findById(id) {
    const [rows] = await this._findById(id);
    return rows[0] ?? null;
  }

  async findByName(name) {
    const [rows] = await this._findByName(`%${name}%`);
    return rows;
  }

  async create(name, description = null) {
    const [result] = await this._create(name, description);
    return result.insertId;
  }

  async update(id, name, description = null) {
    const [result] = await this._update(name, description, id);
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

export const categoriesRepository = new CategoriesRepository();
