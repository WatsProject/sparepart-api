// Skrip untuk membuat akun admin pertama.
// Jalankan dengan: npm run seed:admin
import bcrypt from "bcrypt";
import { dB } from "../index.js";
import { createSchema } from "../schema.js";
import { usersRepository } from "../repository/users.js";

async function seedAdmin() {
  const name = process.env.ADMIN_NAME || "Administrator";
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error("ADMIN_USERNAME dan ADMIN_PASSWORD harus diisi di .env");
  }

  // Pastikan tabel sudah ada
  await createSchema();

  // Jangan buat dobel kalau username sudah ada
  const sudahAda = await usersRepository.findByUsername(username);

  if (sudahAda) {
    console.log(`User "${username}" sudah ada, tidak dibuat ulang.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await usersRepository.createUser(name, username, hashed, "admin");

  console.log(`Admin "${username}" berhasil dibuat.`);
}

seedAdmin()
  .catch((err) => {
    console.error("Gagal membuat admin:", err.message);
    process.exitCode = 1;
  })
  .finally(() => dB.end()); // tutup koneksi supaya skrip berhenti
