import { lazyQuery } from "../lazy.js";

class UsersRepository {
  _findById = lazyQuery(`SELECT * FROM users WHERE id = ?`);
  _findByUsername = lazyQuery(
    `SELECT * FROM users WHERE username = ? ORDER BY id DESC`,
  );
  _createUser = lazyQuery(
    `INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)`,
  );
  _updateUser = lazyQuery(
    `UPDATE users SET name = ?, username = ?, password = ?, role = ? WHERE id = ?`,
  );
  _deleteUser = lazyQuery(`DELETE FROM users WHERE id = ?`);
  _getAllUsers = lazyQuery(`SELECT * FROM users ORDER BY id DESC`);

  async findById(id) {
    const [rows] = await this._findById(id);
    return rows[0] ?? null;
  }

  async findByUsername(username) {
    const [rows] = await this._findByUsername(username);
    return rows[0] ?? null;
  }

  async createUser(name, username, password, role = "admin") {
    const [result] = await this._createUser(name, username, password, role);
    return result.insertId;
  }

  async updateUser(id, name, username, password, role = "admin") {
    const [result] = await this._updateUser(name, username, password, role, id);
    return result.affectedRows > 0;
  }

  async deleteUser(id) {
    const [result] = await this._deleteUser(id);
    return result.affectedRows > 0;
  }

  async getAllUsers() {
    const [rows] = await this._getAllUsers();
    return rows;
  }
}

export const usersRepository = new UsersRepository();
