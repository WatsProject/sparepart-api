import express from "express";
import cors from "cors";

import { logger } from "./logger.js";
import { AppError } from "./errors.js";
import AuthRouter from "./routes/auth.route.js";
import UserRouter from "./routes/user.route.js";
import CategoryRouter from "./routes/category.route.js";
import SupplierRouter from "./routes/supplier.route.js";
import SparepartsRouter from "./routes/spareparts.route.js";
import StockTransactionsRouter from "./routes/stockTransactions.route.js";

const app = express();

// Middleware
// Alamat frontend yang boleh memanggil API ini, dipisah koma di variabel CORS_ORIGIN.
// Kalau variabelnya kosong (misalnya saat pengembangan), semua alamat diizinkan.
const originDiizinkan = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : true;

app.use(cors({ origin: originDiizinkan }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root utama
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Stok Sparepart berjalan.",
  });
});

app.use("/api/auth", AuthRouter);
app.use("/api/users", UserRouter);
app.use("/api/categories", CategoryRouter);
app.use("/api/suppliers", SupplierRouter);
app.use("/api/spareparts", SparepartsRouter);
app.use("/api/stock-transactions", StockTransactionsRouter);

// Endpoint yang tidak ada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  // 1. Error yang kita lempar sendiri: balas dengan status dan pesannya
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // 2. JSON yang dikirim klien rusak
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Format JSON tidak valid",
    });
  }

  // 3. Error MySQL yang sudah dikenal
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "Data sudah ada",
    });
  }

  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({
      success: false,
      message: "Data tidak bisa dihapus karena masih dipakai data lain",
    });
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      success: false,
      message:
        "Data yang dirujuk (kategori/supplier/sparepart) tidak ditemukan",
    });
  }

  // 4. Selebihnya: error yang tidak terduga
  logger.error({ err }, "Internal Server Error");

  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan di server",
  });
});

export default app;
