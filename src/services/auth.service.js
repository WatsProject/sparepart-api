import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { usersRepository } from "../database/repository/users.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../errors.js";

const ALLOWED_ROLES = ["admin", "petugas"];

export const authService = {
  async registerUser(name, username, password, role = "petugas") {
    if (!name || !username || !password) {
      throw new BadRequestError("Nama, username, dan password harus diisi");
    }

    if (!ALLOWED_ROLES.includes(role)) {
      throw new BadRequestError(
        `Role harus salah satu dari: ${ALLOWED_ROLES.join(", ")}`,
      );
    }

    const existingUser = await usersRepository.findByUsername(username);

    if (existingUser) {
      throw new ConflictError("Username sudah digunakan");
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const user = await usersRepository.createUser(
      name,
      username,
      hashedPass,
      role,
    );

    return {
      id: user,
      name,
      username,
      role,
    };
  },

  async loginUser(username, password) {
    if (!username || !password) {
      throw new BadRequestError("Username dan password harus diisi");
    }

    const user = await usersRepository.findByUsername(username);

    if (!user) {
      throw new UnauthorizedError("Username atau password salah");
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedError("Username atau password salah");
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      token,
    };
  },
};
