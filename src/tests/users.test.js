import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createToken, bearer } from "./helpers.js";

let adminToken;
let petugasToken;
let adminId;
let petugasId;

// Helper: admin mengambil data user (untuk cek hasil perubahan)
const ambilUser = (id) =>
  request(app).get(`/api/users/${id}`).set("Authorization", bearer(adminToken));

beforeAll(async () => {
  ({ adminToken, petugasToken } = await createToken());

  // Cari id kedua user lewat daftar user
  const daftar = await request(app)
    .get("/api/users")
    .set("Authorization", bearer(adminToken));

  adminId = daftar.body.data.find((u) => u.username === "admin_test").id;
  petugasId = daftar.body.data.find((u) => u.username === "petugas_test").id;
});

describe("Baca data user", () => {
  it("admin melihat daftar user tanpa password", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.every((u) => u.password === undefined)).toBe(true);
  });

  it("admin melihat detail user tanpa password", async () => {
    const res = await ambilUser(petugasId);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.username).toBe("petugas_test");
    expect(res.body.data.password).toBeUndefined();
  });

  it("petugas ditolak melihat daftar dan detail user (403)", async () => {
    const daftar = await request(app)
      .get("/api/users")
      .set("Authorization", bearer(petugasToken));
    const detail = await request(app)
      .get(`/api/users/${adminId}`)
      .set("Authorization", bearer(petugasToken));

    expect(daftar.statusCode).toBe(403);
    expect(detail.statusCode).toBe(403);
  });
});

describe("Ubah data user: celah petugas", () => {
  it("petugas boleh mengubah akunnya sendiri", async () => {
    const res = await request(app)
      .put(`/api/users/${petugasId}`)
      .set("Authorization", bearer(petugasToken))
      .send({
        name: "Petugas Baru",
        username: "petugas_test",
        password: "rahasia123",
        role: "petugas",
      });

    expect(res.statusCode).toBe(200);

    const cek = await ambilUser(petugasId);
    expect(cek.body.data.name).toBe("Petugas Baru");
    expect(cek.body.data.role).toBe("petugas");
  });

  it("petugas boleh mengubah akunnya sendiri tanpa mengirim role", async () => {
    const res = await request(app)
      .put(`/api/users/${petugasId}`)
      .set("Authorization", bearer(petugasToken))
      .send({
        name: "Petugas Tanpa Role",
        username: "petugas_test",
        password: "rahasia123",
      });

    expect(res.statusCode).toBe(200);

    const cek = await ambilUser(petugasId);
    expect(cek.body.data.role).toBe("petugas");
  });

  it("petugas ditolak mengubah akun admin (403)", async () => {
    const res = await request(app)
      .put(`/api/users/${adminId}`)
      .set("Authorization", bearer(petugasToken))
      .send({
        name: "Diretas",
        username: "admin_test",
        password: "passwordbaru",
        role: "admin",
      });

    expect(res.statusCode).toBe(403);

    // Data admin tidak berubah
    const cek = await ambilUser(adminId);
    expect(cek.body.data.name).toBe("Admin Test");
  });

  it("petugas ditolak menaikkan role-nya sendiri jadi admin (403)", async () => {
    const res = await request(app)
      .put(`/api/users/${petugasId}`)
      .set("Authorization", bearer(petugasToken))
      .send({
        name: "Petugas Nakal",
        username: "petugas_test",
        password: "rahasia123",
        role: "admin",
      });

    expect(res.statusCode).toBe(403);

    const cek = await ambilUser(petugasId);
    expect(cek.body.data.role).toBe("petugas");
  });

  it("admin boleh mengubah role user lain", async () => {
    const buat = await request(app)
      .post("/api/auth/register")
      .set("Authorization", bearer(adminToken)) // tambahan: register butuh token admin
      .send({
        name: "User X",
        username: "user_x",
        password: "rahasia123",
        role: "admin",
      });
    const idBaru = buat.body.data.id;

    const res = await request(app)
      .put(`/api/users/${idBaru}`)
      .set("Authorization", bearer(adminToken))
      .send({
        name: "User X",
        username: "user_x",
        password: "rahasia123",
        role: "petugas",
      });

    expect(res.statusCode).toBe(200);

    const cek = await ambilUser(idBaru);
    expect(cek.body.data.role).toBe("petugas");
  });

  it("role yang tidak valid ditolak", async () => {
    const res = await request(app)
      .put(`/api/users/${petugasId}`)
      .set("Authorization", bearer(adminToken))
      .send({
        name: "Petugas Test",
        username: "petugas_test",
        password: "rahasia123",
        role: "superadmin",
      });

    expect(res.statusCode).toBe(400);
  });
});

describe("Hapus user", () => {
  it("petugas ditolak menghapus user (403)", async () => {
    const res = await request(app)
      .delete(`/api/users/${adminId}`)
      .set("Authorization", bearer(petugasToken));

    expect(res.statusCode).toBe(403);
  });

  it("admin menghapus user", async () => {
    const buat = await request(app)
      .post("/api/auth/register")
      .set("Authorization", bearer(adminToken)) // tambahan: register butuh token admin
      .send({
        name: "Hapus Aku",
        username: "hapus_aku",
        password: "rahasia123",
        role: "admin",
      });
    const idBaru = buat.body.data.id;

    const res = await request(app)
      .delete(`/api/users/${idBaru}`)
      .set("Authorization", bearer(adminToken));

    expect(res.statusCode).toBe(200);

    const cek = await ambilUser(idBaru);
    expect(cek.statusCode).toBe(404); // sudah tidak ditemukan
  });

  describe("Ubah data user: password dan username", () => {
    // Helper: admin mendaftarkan user baru dan mengembalikan id-nya
    const buatUser = async (name, username) => {
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", bearer(adminToken))
        .send({ name, username, password: "rahasia123" });

      return res.body.data.id;
    };

    it("password boleh dikosongkan: password lama tetap berlaku", async () => {
      const id = await buatUser("Pass Opsional", "pass_opsional");

      const ubah = await request(app)
        .put(`/api/users/${id}`)
        .set("Authorization", bearer(adminToken))
        .send({ name: "Nama Baru", username: "pass_opsional" });

      expect(ubah.statusCode).toBe(200);

      // Password lama masih bisa dipakai login
      const login = await request(app)
        .post("/api/auth/login")
        .send({ username: "pass_opsional", password: "rahasia123" });

      expect(login.statusCode).toBe(200);

      const cek = await ambilUser(id);
      expect(cek.body.data.name).toBe("Nama Baru");
    });

    it("password baru menggantikan password lama", async () => {
      const id = await buatUser("Pass Ganti", "pass_ganti");

      await request(app)
        .put(`/api/users/${id}`)
        .set("Authorization", bearer(adminToken))
        .send({
          name: "Pass Ganti",
          username: "pass_ganti",
          password: "passwordbaru",
        });

      const lama = await request(app)
        .post("/api/auth/login")
        .send({ username: "pass_ganti", password: "rahasia123" });
      const baru = await request(app)
        .post("/api/auth/login")
        .send({ username: "pass_ganti", password: "passwordbaru" });

      expect(lama.statusCode).toBe(401);
      expect(baru.statusCode).toBe(200);
    });

    it("username kembar saat mengubah ditolak dengan pesan yang jelas", async () => {
      await buatUser("Kembar C", "kembar_c");
      const idD = await buatUser("Kembar D", "kembar_d");

      const res = await request(app)
        .put(`/api/users/${idD}`)
        .set("Authorization", bearer(adminToken))
        .send({ name: "Kembar D", username: "kembar_c" }); // dipakai user lain

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe("Username sudah digunakan");
    });

    it("nama atau username kosong ditolak dengan 400", async () => {
      const id = await buatUser("Nama Kosong", "nama_kosong");

      const res = await request(app)
        .put(`/api/users/${id}`)
        .set("Authorization", bearer(adminToken))
        .send({ username: "nama_kosong" });

      expect(res.statusCode).toBe(400);
    });
  });
});
