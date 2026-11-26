import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createToken, bearer } from "./helpers.js";

let adminToken;

beforeAll(async () => {
  ({ adminToken } = await createToken());
});

// Helper: request yang sudah membawa token admin
// contoh: admin("post", "/api/categories").send({ name: "Oli" })
const admin = (method, url) =>
  request(app)[method](url).set("Authorization", bearer(adminToken));

describe("Response sparepart sesuai dokumentasi", () => {
  it("POST, pencarian, dan DELETE memakai pesan yang tertulis", async () => {
    const buat = await admin("post", "/api/spareparts").send({
      kode: "DOK-001",
      name: "Sparepart Dokumentasi",
    });

    expect(buat.statusCode).toBe(201);
    expect(buat.body.message).toBe("Sparepart berhasil ditambahkan.");

    const cari = await admin("get", "/api/spareparts/search?name=Dokumentasi");

    expect(cari.statusCode).toBe(200);
    expect(cari.body.message).toBe("Data sparepart berhasil dicari.");
    expect(cari.body.data).toHaveLength(1);

    const hapus = await admin("delete", `/api/spareparts/${buat.body.data.id}`);

    expect(hapus.statusCode).toBe(200);
    expect(hapus.body.message).toBe("Sparepart berhasil dihapus.");
    expect(hapus.body.data).toBeUndefined(); // DELETE tanpa field data
  });
});

describe("Relasi sparepart", () => {
  it("category_id yang tidak ada ditolak dengan 400", async () => {
    const res = await admin("post", "/api/spareparts").send({
      kode: "DOK-002",
      name: "Kategori Hantu",
      category_id: 99999,
    });

    expect(res.statusCode).toBe(400);
  });

  it("supplier_id yang tidak ada ditolak dengan 400", async () => {
    const res = await admin("post", "/api/spareparts").send({
      kode: "DOK-003",
      name: "Supplier Hantu",
      supplier_id: 99999,
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Username kembar saat mengubah user", () => {
  it("PUT /users/:id dengan username yang sudah dipakai ditolak dengan 409", async () => {
    await admin("post", "/api/auth/register").send({
      name: "Kembar A",
      username: "kembar_a",
      password: "rahasia123",
    });
    const b = await admin("post", "/api/auth/register").send({
      name: "Kembar B",
      username: "kembar_b",
      password: "rahasia123",
    });

    const res = await admin("put", `/api/users/${b.body.data.id}`).send({
      name: "Kembar B",
      username: "kembar_a", // sudah dipakai user lain
      password: "rahasia123",
    });

    expect(res.statusCode).toBe(409);
  });
});

// Test di bawah mencatat perilaku saat ini (bagian 10 dokumentasi).
// Kalau nanti validasinya diperbaiki, ubah angka dan hasilnya di sini.
describe("Keterbatasan yang diketahui", () => {
  it("PUT kategori tanpa name menghasilkan 500", async () => {
    const buat = await admin("post", "/api/categories").send({ name: "Uji" });

    const res = await admin("put", `/api/categories/${buat.body.data.id}`).send(
      {
        description: "tanpa nama",
      },
    );

    expect(res.statusCode).toBe(500);
  });

  it("PUT supplier tanpa name menghasilkan 500", async () => {
    const buat = await admin("post", "/api/suppliers").send({ name: "Uji" });

    const res = await admin("put", `/api/suppliers/${buat.body.data.id}`).send({
      address: "tanpa nama",
    });

    expect(res.statusCode).toBe(500);
  });

  it("pencarian kategori tanpa name membalas 200 dengan hasil kosong", async () => {
    const res = await admin("get", "/api/categories/search");

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("pencarian supplier tanpa name membalas 200 dengan hasil kosong", async () => {
    const res = await admin("get", "/api/suppliers/search");

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
