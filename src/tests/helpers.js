import bcrypt from "bcrypt";
import request from "supertest";
import app from "../app.js";
import { usersRepository } from "../database/repository/users.js";

const PASSWORD = "rahasia123";

export const bearer = (token) => `Bearer ${token}`;

async function login(username) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password: PASSWORD });

  return res.body.data.token;
}

export async function createToken() {
  // 1. Admin pertama dibuat langsung lewat repository (seperti skrip seed),
  //    karena register sekarang butuh admin yang sudah login
  const hashed = await bcrypt.hash(PASSWORD, 10);
  await usersRepository.createUser("Admin Test", "admin_test", hashed, "admin");

  const adminToken = await login("admin_test");

  // 2. Petugas didaftarkan lewat API oleh admin
  await request(app)
    .post("/api/auth/register")
    .set("Authorization", bearer(adminToken))
    .send({
      name: "Petugas Test",
      username: "petugas_test",
      password: PASSWORD,
      role: "petugas",
    });

  const petugasToken = await login("petugas_test");

  return { adminToken, petugasToken };
}
