import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createToken, bearer } from "./helpers.js";

let adminToken;
let petugasToken;

beforeAll(async () => {
  ({ adminToken, petugasToken } = await createToken());
});

describe("Kategori", () => {
  let categoryId;

  it("admin membuat kategori", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", bearer(adminToken))
      .send({ name: "Oli", description: "Oli mesin" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe("Oli");
    categoryId = res.body.data.id;
  });

  it("kategori tanpa nama ditolak", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", bearer(adminToken))
      .send({ description: "tanpa nama" });

    expect(res.statusCode).toBe(400);
  });

  it("mengambil semua kategori", async () => {
    const res = await request(app)
      .get("/api/categories")
      .set("Authorization", bearer(petugasToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("mengambil kategori berdasarkan id", async () => {
    const res = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe("Oli");
  });

  it("id yang tidak ada ditolak", async () => {
    const res = await request(app)
      .get("/api/categories/99999")
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(404);
  });

  it("mencari kategori berdasarkan nama", async () => {
    const res = await request(app)
      .get("/api/categories/search?name=Ol")
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("admin memperbarui kategori", async () => {
    const res = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set("Authorization", bearer(adminToken))
      .send({ name: "Oli Mesin", description: "Diperbarui" });

    expect(res.statusCode).toBe(200);

    const cek = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set("Authorization", bearer(adminToken));

    expect(cek.body.data.name).toBe("Oli Mesin");
  });

  it("petugas ditolak memperbarui dan menghapus (403)", async () => {
    const put = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set("Authorization", bearer(petugasToken))
      .send({ name: "Hack" });
    const del = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", bearer(petugasToken));

    expect(put.statusCode).toBe(403);
    expect(del.statusCode).toBe(403);
  });

  it("admin menghapus kategori", async () => {
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(200);

    const cek = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set("Authorization", bearer(adminToken));

    expect(cek.statusCode).toBe(404); // sudah tidak ditemukan
  });
});

describe("Supplier", () => {
  let supplierId;

  it("admin membuat supplier", async () => {
    const res = await request(app)
      .post("/api/suppliers")
      .set("Authorization", bearer(adminToken))
      .send({
        name: "PT Maju Jaya",
        address: "Semarang",
        phone: "08123456789",
        contact: "Budi",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe("PT Maju Jaya");
    supplierId = res.body.data.id;
  });

  it("supplier tanpa nama ditolak", async () => {
    const res = await request(app)
      .post("/api/suppliers")
      .set("Authorization", bearer(adminToken))
      .send({ address: "Semarang" });

    expect(res.statusCode).toBe(400);
  });

  it("petugas boleh melihat daftar dan mencari supplier", async () => {
    const semua = await request(app)
      .get("/api/suppliers")
      .set("Authorization", bearer(petugasToken));
    const cari = await request(app)
      .get("/api/suppliers/search?name=Maju")
      .set("Authorization", bearer(petugasToken));

    expect(semua.statusCode).toBe(200);
    expect(cari.statusCode).toBe(200);
    expect(cari.body.data).toHaveLength(1);
  });

  it("petugas ditolak melihat detail supplier (khusus admin)", async () => {
    const res = await request(app)
      .get(`/api/suppliers/${supplierId}`)
      .set("Authorization", bearer(petugasToken));

    expect(res.statusCode).toBe(403);
  });

  it("admin melihat detail, memperbarui, lalu menghapus", async () => {
    const detail = await request(app)
      .get(`/api/suppliers/${supplierId}`)
      .set("Authorization", bearer(adminToken));
    expect(detail.statusCode).toBe(200);

    const put = await request(app)
      .put(`/api/suppliers/${supplierId}`)
      .set("Authorization", bearer(adminToken))
      .send({
        name: "PT Maju Mundur",
        address: "Ungaran",
        phone: "0811",
        contact: "Sari",
      });
    expect(put.statusCode).toBe(200);

    const del = await request(app)
      .delete(`/api/suppliers/${supplierId}`)
      .set("Authorization", bearer(adminToken));
    expect(del.statusCode).toBe(200);
  });
});
