// Error khusus aplikasi. Membawa kode status HTTP supaya error handler
// bisa membalas dengan status yang tepat (bukan selalu 500).
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

// 400: data yang dikirim tidak valid atau kurang
export class BadRequestError extends AppError {
  constructor(message = "Permintaan tidak valid") {
    super(message, 400);
  }
}

// 401: belum login atau login gagal
export class UnauthorizedError extends AppError {
  constructor(message = "Tidak terautentikasi") {
    super(message, 401);
  }
}

// 404: data yang dicari tidak ada
export class NotFoundError extends AppError {
  constructor(message = "Data tidak ditemukan") {
    super(message, 404);
  }
}

// 409: bentrok dengan data yang sudah ada (kode kembar, stok kurang, dll.)
export class ConflictError extends AppError {
  constructor(message = "Data bentrok") {
    super(message, 409);
  }
}
