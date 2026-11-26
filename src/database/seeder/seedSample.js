// Skrip untuk mengisi data contoh. Jalankan dengan: npm run seed:sample
// Aman dijalankan sekali; kalau data contoh sudah ada, skrip berhenti.
import { dB } from "../index.js";
import { usersRepository } from "../repository/users.js";
import { categoriesRepository } from "../repository/categories.js";
import { suppliersRepository } from "../repository/suppliers.js";
import { sparepartsRepository } from "../repository/spareparts.js";
import { stockTransactionsRepository } from "../repository/stockTransactions.js";

async function seedSample() {
  // Kalau sparepart contoh sudah ada, jangan buat dobel
  if (await sparepartsRepository.findByKode("BSI-001")) {
    console.log("Data contoh sudah ada, tidak dibuat ulang.");
    return;
  }

  // Transaksi perlu tahu siapa pencatatnya: pakai akun admin yang ada
  const users = await usersRepository.getAllUsers();
  const admin = users.find((u) => u.role === "admin");

  if (!admin) {
    throw new Error("Belum ada admin. Jalankan npm run seed:admin dulu.");
  }

  // Kategori
  const oli = await categoriesRepository.create("Oli", "Oli mesin dan pelumas");
  const busi = await categoriesRepository.create(
    "Busi",
    "Busi dan komponen pengapian",
  );
  const rem = await categoriesRepository.create("Rem", "Kampas rem dan cakram");
  const aki = await categoriesRepository.create("Aki", "Baterai kendaraan");
  const ban = await categoriesRepository.create("Ban", "Ban dan velg");

  // Supplier
  const majuJaya = await suppliersRepository.create(
    "PT Maju Jaya",
    "Jl. Pemuda No. 12, Semarang",
    "0812-3456-7890",
    "Budi",
  );
  const sinarMotor = await suppliersRepository.create(
    "CV Sinar Motor",
    "Jl. Gatot Subroto No. 5, Ungaran",
    "0813-1111-2222",
    "Sari",
  );
  const berkahJaya = await suppliersRepository.create(
    "UD Berkah Jaya",
    "Jl. Diponegoro No. 8, Salatiga",
    "0857-3333-4444",
    "Andi",
  );

  // Sparepart: (kode, nama, merek, satuan, kategori, supplier, harga beli, harga jual, stok awal, stok minimum, deskripsi)
  const olis = await sparepartsRepository.createSparepart(
    "OLI-001",
    "Oli Mesin 1 Liter",
    "Federal",
    "pcs",
    oli,
    berkahJaya,
    35000,
    45000,
    5,
    10,
    null,
  );
  const busiNgk = await sparepartsRepository.createSparepart(
    "BSI-001",
    "Busi NGK",
    "NGK",
    "pcs",
    busi,
    majuJaya,
    15000,
    20000,
    10,
    5,
    null,
  );
  const kampas = await sparepartsRepository.createSparepart(
    "KRD-002",
    "Kampas Rem Depan",
    "Indopart",
    "pcs",
    rem,
    sinarMotor,
    28000,
    38000,
    8,
    10,
    null,
  );
  await sparepartsRepository.createSparepart(
    "BSM-003",
    "Busi Motor",
    "NGK",
    "pcs",
    busi,
    majuJaya,
    12000,
    18000,
    0,
    15,
    null,
  );
  const akiMotor = await sparepartsRepository.createSparepart(
    "AKI-001",
    "Aki Motor",
    "Yuasa",
    "pcs",
    aki,
    majuJaya,
    180000,
    230000,
    10,
    3,
    null,
  );
  const banLuar = await sparepartsRepository.createSparepart(
    "BAN-001",
    "Ban Luar 80/90-14",
    "IRC",
    "pcs",
    ban,
    sinarMotor,
    150000,
    195000,
    0,
    5,
    null,
  );

  // Transaksi: (tanggal, jenis, sparepart, supplier, pencatat, jumlah, harga beli, catatan)
  const t = stockTransactionsRepository;
  await t.createTransaction(
    "2026-09-28",
    "in",
    olis,
    berkahJaya,
    admin.id,
    20,
    35000,
    "Pembelian bulanan",
  );
  await t.createTransaction(
    "2026-09-25",
    "in",
    banLuar,
    sinarMotor,
    admin.id,
    12,
    150000,
    "Restock",
  );
  await t.createTransaction(
    "2026-09-29",
    "out",
    busiNgk,
    null,
    admin.id,
    4,
    0,
    "Servis motor",
  );
  await t.createTransaction(
    "2026-09-27",
    "out",
    kampas,
    null,
    admin.id,
    3,
    0,
    null,
  );
  await t.createTransaction(
    "2026-09-30",
    "out",
    akiMotor,
    null,
    admin.id,
    2,
    0,
    "Dijual ke pelanggan",
  );

  console.log("Data contoh berhasil dibuat.");
}

seedSample()
  .catch((err) => {
    console.error("Gagal membuat data contoh:", err.message);
    process.exitCode = 1;
  })
  .finally(() => dB.end());
