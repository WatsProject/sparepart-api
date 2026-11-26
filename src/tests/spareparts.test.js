import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createToken, bearer } from "./helpers.js";

let adminToken;
let petugasToken;
let categoryId;
let supplierId;

// Data sparepart dasar; stok 10, batas minimum 5 -> status "aman"
const dataBusi = () => ({
  kode: "BSI-001",
  name: "Busi NGK",
  brand: "NGK",
  unit: "pcs",
  category_id: categoryId,
  supplier_id: supplierId,
  buy_price: 15000,
  sell_price: 20000,
  stock: 10,
  min_stock: 5,
  description: "Busi motor",
});

beforeAll(async () => {
  ({ adminToken, petugasToken } = await createToken());

  // Sparepart butuh kategori dan supplier yang sudah ada
  const kat = await request(app)
    .post("/api/categories")
    .set("Authorization", bearer(adminToken))
    .send({ name: "Busi" });
  categoryId = kat.body.data.id;

  const sup = await request(app)
    .post("/api/suppliers")
    .set("Authorization", bearer(adminToken))
    .send({ name: "PT Maju Jaya" });
  supplierId = sup.body.data.id;
});

describe("Sparepart", () => {
  let sparepartId;

  it("admin membuat sparepart", async () => {
    const res = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(adminToken))
      .send(dataBusi());

    expect(res.statusCode).toBe(201);
    expect(res.body.data.kode).toBe("BSI-001");
    expect(res.body.data.status).toBe("aman");
    expect(res.body.data.category_name).toBe("Busi"); // tambahan
    expect(res.body.data.supplier_name).toBe("PT Maju Jaya"); // tambahan
    expect(res.body.data.buy_price).toBe("15000.00"); // DECIMAL berupa string
    sparepartId = res.body.data.id;
  });

  it("kode yang sama ditolak", async () => {
    const res = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(adminToken))
      .send(dataBusi());

    expect(res.statusCode).toBe(409);
  });

  it("kode atau nama kosong ditolak", async () => {
    const res = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(adminToken))
      .send({ brand: "NGK" });

    expect(res.statusCode).toBe(400);
  });

  it("harga negatif dan stok negatif ditolak", async () => {
    const harga = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(adminToken))
      .send({ ...dataBusi(), kode: "BSI-002", buy_price: -1 });
    const stok = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(adminToken))
      .send({ ...dataBusi(), kode: "BSI-003", stock: -5 });

    expect(harga.statusCode).toBe(400);
    expect(stok.statusCode).toBe(400);
  });

  it("status otomatis: hampir habis dan habis", async () => {
    const hampir = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(adminToken))
      .send({ ...dataBusi(), kode: "BSI-010", stock: 3, min_stock: 5 });
    const habis = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(adminToken))
      .send({ ...dataBusi(), kode: "BSI-011", stock: 0, min_stock: 5 });

    expect(hampir.body.data.status).toBe("hampir habis");
    expect(habis.body.data.status).toBe("habis");
  });

  it("petugas boleh membaca daftar, detail, dan pencarian", async () => {
    const semua = await request(app)
      .get("/api/spareparts")
      .set("Authorization", bearer(petugasToken));
    const detail = await request(app)
      .get(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(petugasToken));
    const cari = await request(app)
      .get("/api/spareparts/search?name=Busi")
      .set("Authorization", bearer(petugasToken));

    expect(semua.statusCode).toBe(200);
    expect(semua.body.data.length).toBeGreaterThanOrEqual(3);
    expect(detail.body.data.name).toBe("Busi NGK");
    expect(cari.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // Test baru: daftar, detail, dan pencarian membawa nama kategori dan supplier
  it("daftar, detail, dan pencarian membawa nama kategori dan supplier", async () => {
    const semua = await request(app)
      .get("/api/spareparts")
      .set("Authorization", bearer(adminToken));
    const detail = await request(app)
      .get(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(adminToken));
    const cari = await request(app)
      .get("/api/spareparts/search?name=Busi")
      .set("Authorization", bearer(adminToken));

    const busi = semua.body.data.find((s) => s.id === sparepartId);

    expect(busi.category_name).toBe("Busi");
    expect(busi.supplier_name).toBe("PT Maju Jaya");
    expect(detail.body.data.category_name).toBe("Busi");
    expect(detail.body.data.supplier_name).toBe("PT Maju Jaya");
    expect(cari.body.data[0].category_name).toBe("Busi");
  });

  // Test baru: sparepart tanpa kategori dan supplier tetap bisa dibuat
  it("sparepart tanpa kategori dan supplier memiliki nama null", async () => {
    const res = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(adminToken))
      .send({ kode: "NUL-001", name: "Tanpa Relasi" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.category_name).toBeNull();
    expect(res.body.data.supplier_name).toBeNull();
  });

  it("pencarian tanpa nama ditolak", async () => {
    const res = await request(app)
      .get("/api/spareparts/search")
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(400);
  });

  it("petugas ditolak membuat, mengubah, dan menghapus (403)", async () => {
    const post = await request(app)
      .post("/api/spareparts")
      .set("Authorization", bearer(petugasToken))
      .send({ ...dataBusi(), kode: "BSI-099" });
    const put = await request(app)
      .put(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(petugasToken))
      .send(dataBusi());
    const del = await request(app)
      .delete(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(petugasToken));

    expect(post.statusCode).toBe(403);
    expect(put.statusCode).toBe(403);
    expect(del.statusCode).toBe(403);
  });

  it("admin memperbarui sparepart (payload lengkap)", async () => {
    const res = await request(app)
      .put(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(adminToken))
      .send({ ...dataBusi(), name: "Busi NGK Iridium", sell_price: 25000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe("Busi NGK Iridium");
    expect(res.body.data.sell_price).toBe("25000.00");
  });

  it("update dengan kode milik sparepart lain ditolak", async () => {
    const res = await request(app)
      .put(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(adminToken))
      .send({ ...dataBusi(), kode: "BSI-010" });

    expect(res.statusCode).toBe(409);
  });

  it("admin menghapus sparepart", async () => {
    const res = await request(app)
      .delete(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(200);

    const cek = await request(app)
      .get(`/api/spareparts/${sparepartId}`)
      .set("Authorization", bearer(adminToken));

    expect(cek.statusCode).toBe(404); // sudah tidak ditemukan
  });
});
