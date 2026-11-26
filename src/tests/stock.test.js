import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createToken, bearer } from "./helpers.js";

let adminToken;
let petugasToken;
let sparepartId;
let supplierId;

// Helper: mengirim transaksi stok baru
const kirim = (token, body) =>
  request(app)
    .post("/api/stock-transactions")
    .set("Authorization", bearer(token))
    .send(body);

// Helper: mengambil data sparepart terbaru (untuk cek stok)
const ambilSparepart = async () => {
  const res = await request(app)
    .get(`/api/spareparts/${sparepartId}`)
    .set("Authorization", bearer(adminToken));
  return res.body.data;
};

beforeAll(async () => {
  ({ adminToken, petugasToken } = await createToken());

  const sup = await request(app)
    .post("/api/suppliers")
    .set("Authorization", bearer(adminToken))
    .send({ name: "PT Maju Jaya" });
  supplierId = sup.body.data.id;

  // Stok awal sparepart: 10
  const sp = await request(app)
    .post("/api/spareparts")
    .set("Authorization", bearer(adminToken))
    .send({
      kode: "BSI-001",
      name: "Busi NGK",
      supplier_id: supplierId,
      buy_price: 15000,
      sell_price: 20000,
      stock: 10,
      min_stock: 5,
    });
  sparepartId = sp.body.data.id;
});

describe("Transaksi stok: validasi dan data", () => {
  let transaksiMasukId;

  it("petugas mencatat barang masuk", async () => {
    const res = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "in",
      sparepartId,
      supplierId,
      quantity: 5,
      buyPrice: 15000,
      notes: "Pembelian awal",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.type).toBe("in");
    expect(res.body.data.quantity).toBe(5);
    expect(res.body.data.supplier_name).toBe("PT Maju Jaya");
    expect(res.body.data.user_name).toBe("Petugas Test");
    transaksiMasukId = res.body.data.id;
  });

  it("barang masuk tanpa supplier ditolak", async () => {
    const res = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "in",
      sparepartId,
      quantity: 5,
    });

    expect(res.statusCode).toBe(400);
  });

  it("jumlah 0 dan tipe tidak valid ditolak", async () => {
    const nol = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "in",
      sparepartId,
      supplierId,
      quantity: 0,
    });
    const tipe = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "pindah",
      sparepartId,
      quantity: 1,
    });

    expect(nol.statusCode).toBe(400);
    expect(tipe.statusCode).toBe(400);
  });

  it("sparepart yang tidak ada ditolak", async () => {
    const res = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "out",
      sparepartId: 99999,
      quantity: 1,
    });

    expect(res.statusCode).toBe(404);
  });

  it("barang keluar melebihi stok ditolak", async () => {
    const res = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "out",
      sparepartId,
      quantity: 999,
    });

    expect(res.statusCode).toBe(409);
  });

  it("barang keluar: supplier dan harga beli dikosongkan otomatis", async () => {
    const res = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "out",
      sparepartId,
      supplierId,
      quantity: 2,
      buyPrice: 99999,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.supplier_id).toBeNull();
    expect(res.body.data.buy_price).toBe("0.00");
  });

  it("daftar semua, masuk saja, dan keluar saja", async () => {
    const semua = await request(app)
      .get("/api/stock-transactions")
      .set("Authorization", bearer(petugasToken));
    const masuk = await request(app)
      .get("/api/stock-transactions/in")
      .set("Authorization", bearer(petugasToken));
    const keluar = await request(app)
      .get("/api/stock-transactions/out")
      .set("Authorization", bearer(petugasToken));

    expect(semua.body.data).toHaveLength(2);
    expect(masuk.body.data.every((t) => t.type === "in")).toBe(true);
    expect(keluar.body.data.every((t) => t.type === "out")).toBe(true);
  });

  it("mengambil transaksi berdasarkan id", async () => {
    const res = await request(app)
      .get(`/api/stock-transactions/${transaksiMasukId}`)
      .set("Authorization", bearer(petugasToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.sparepart_name).toBe("Busi NGK");
  });

  it("memperbarui transaksi", async () => {
    const res = await request(app)
      .put(`/api/stock-transactions/${transaksiMasukId}`)
      .set("Authorization", bearer(petugasToken))
      .send({
        date: "2026-11-02",
        type: "in",
        sparepartId,
        supplierId,
        quantity: 8,
        buyPrice: 16000,
        notes: "Direvisi",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.quantity).toBe(8);
    expect(res.body.data.notes).toBe("Direvisi");
  });

  it("sparepart yang sudah punya transaksi tidak bisa dihapus", async () => {
    const res = await request(app)
      .delete(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(409); // ditolak foreign key (RESTRICT)
  });

  it("menghapus transaksi", async () => {
    const res = await request(app)
      .delete(`/api/stock-transactions/${transaksiMasukId}`)
      .set("Authorization", bearer(petugasToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(transaksiMasukId);
  });
});

describe("Dampak transaksi ke stok", () => {
  it("barang masuk menambah stok", async () => {
    const sebelum = (await ambilSparepart()).stock;

    await kirim(petugasToken, {
      date: "2026-11-02",
      type: "in",
      sparepartId,
      supplierId,
      quantity: 5,
      buyPrice: 15000,
    });

    expect((await ambilSparepart()).stock).toBe(sebelum + 5);
  });

  it("barang keluar mengurangi stok", async () => {
    const sebelum = (await ambilSparepart()).stock;

    await kirim(petugasToken, {
      date: "2026-11-02",
      type: "out",
      sparepartId,
      quantity: 3,
    });

    expect((await ambilSparepart()).stock).toBe(sebelum - 3);
  });

  it("mengubah jumlah transaksi menyesuaikan stok", async () => {
    const buat = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "in",
      sparepartId,
      supplierId,
      quantity: 5,
      buyPrice: 15000,
    });
    const sebelum = (await ambilSparepart()).stock;

    // Jumlah diubah 5 -> 8, jadi stok harus naik 3
    await request(app)
      .put(`/api/stock-transactions/${buat.body.data.id}`)
      .set("Authorization", bearer(petugasToken))
      .send({
        date: "2026-11-02",
        type: "in",
        sparepartId,
        supplierId,
        quantity: 8,
        buyPrice: 15000,
      });

    expect((await ambilSparepart()).stock).toBe(sebelum + 3);
  });

  it("menghapus transaksi mengembalikan stok", async () => {
    const buat = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "out",
      sparepartId,
      quantity: 2,
    });
    const sebelum = (await ambilSparepart()).stock;

    await request(app)
      .delete(`/api/stock-transactions/${buat.body.data.id}`)
      .set("Authorization", bearer(petugasToken));

    // Barang keluar 2 dibatalkan, jadi stok naik 2
    expect((await ambilSparepart()).stock).toBe(sebelum + 2);
  });

  it("transaksi yang membuat stok minus ditolak dan stok tidak berubah", async () => {
    const sebelum = (await ambilSparepart()).stock;

    const res = await kirim(petugasToken, {
      date: "2026-11-02",
      type: "out",
      sparepartId,
      quantity: sebelum + 1,
    });

    expect(res.statusCode).toBe(409);
    expect((await ambilSparepart()).stock).toBe(sebelum);
  });
});
