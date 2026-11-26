import bcrypt from "bcrypt";

import { usersRepository } from "../database/repository/users.js";
import { BadRequestError, ConflictError, NotFoundError } from "../errors.js";

const ALLOWED_ROLES = ["admin", "petugas"];

export const userService = {
  async getAllUsers() {
    const users = await usersRepository.getAllUsers();

    return users.map(({ password, ...user }) => user);
  },

  async getUserById(id) {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError("User tidak ditemukan");
    }

    const { password, ...users } = user;

    return users;
  },

  async updateUser(id, name, username, password, role) {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError("User tidak ditemukan");
    }

    // Berubah: password tidak lagi wajib, hanya nama dan username
    if (!name || !username) {
      throw new BadRequestError("Nama dan username harus diisi");
    }

    // Kalau role tidak dikirim, pakai role yang sekarang
    const newRole = role ?? user.role;

    if (!ALLOWED_ROLES.includes(newRole)) {
      throw new BadRequestError(
        `Role harus salah satu dari: ${ALLOWED_ROLES.join(", ")}`,
      );
    }

    // Baru: username tidak boleh dipakai user lain
    // (memakai username sendiri yang tidak berubah tetap boleh)
    const existingUser = await usersRepository.findByUsername(username);

    if (existingUser && existingUser.id !== Number(id)) {
      throw new ConflictError("Username sudah digunakan");
    }

    // Berubah: password hanya di-hash ulang kalau dikirim.
    // Kalau kosong, pakai hash password lama.
    const newPassword = password
      ? await bcrypt.hash(password, 10)
      : user.password;

    return await usersRepository.updateUser(
      id,
      name,
      username,
      newPassword,
      newRole,
    );
  },

  async deleteUser(id) {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError("User tidak ditemukan");
    }

    return await usersRepository.deleteUser(id);
  },
};
