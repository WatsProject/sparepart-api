import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createToken, bearer } from "./helpers.js";

let adminToken;
let petugasToken;

beforeAll(async () => {
  ({ adminToken, petugasToken } = await createToken());
});

describe("Login", () => {
  it("login berhasil mengembalikan token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin_test", password: "rahasia123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.role).toBe("admin");
  });

  it("login dengan password salah ditolak", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin_test", password: "salah" });

    expect(res.statusCode).toBe(401);
  });
});

describe("Register", () => {
  it("tanpa token ditolak dengan 401", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Penyusup",
      username: "penyusup",
      password: "abc12345",
      role: "admin",
    });

    expect(res.statusCode).toBe(401);
  });

  it("petugas ditolak mendaftarkan user dengan 403", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", bearer(petugasToken))
      .send({ name: "Teman", username: "teman", password: "abc12345" });

    expect(res.statusCode).toBe(403);
  });

  it("admin mendaftarkan petugas", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", bearer(adminToken))
      .send({
        name: "Petugas Dua",
        username: "petugas_dua",
        password: "abc12345",
        role: "petugas",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.role).toBe("petugas");
  });

  it("role yang tidak dikirim otomatis menjadi petugas", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", bearer(adminToken))
      .send({
        name: "Tanpa Role",
        username: "tanpa_role",
        password: "abc12345",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.role).toBe("petugas");
  });

  it("admin mendaftarkan admin baru", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", bearer(adminToken))
      .send({
        name: "Admin Dua",
        username: "admin_dua",
        password: "abc12345",
        role: "admin",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.role).toBe("admin");
  });

  it("role superadmin ditolak", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", bearer(adminToken))
      .send({
        name: "Super",
        username: "super",
        password: "abc12345",
        role: "superadmin",
      });

    expect(res.statusCode).toBe(400);
  });

  it("username yang sama ditolak", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", bearer(adminToken))
      .send({ name: "Dobel", username: "admin_test", password: "abc12345" });

    expect(res.statusCode).toBe(409);
  });
});

describe("Hak akses", () => {
  it("tanpa token ditolak dengan 401", async () => {
    const res = await request(app).get("/api/spareparts");

    expect(res.statusCode).toBe(401);
  });

  it("token palsu ditolak dengan 401", async () => {
    const res = await request(app)
      .get("/api/spareparts")
      .set("Authorization", "Bearer token_palsu");

    expect(res.statusCode).toBe(401);
  });

  it("petugas boleh melihat daftar sparepart", async () => {
    const res = await request(app)
      .get("/api/spareparts")
      .set("Authorization", bearer(petugasToken));

    expect(res.statusCode).toBe(200);
  });

  it("petugas ditolak membuat kategori (khusus admin) dengan 403", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", bearer(petugasToken))
      .send({ name: "Oli" });

    expect(res.statusCode).toBe(403);
  });

  it("admin boleh membuat kategori", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", bearer(adminToken))
      .send({ name: "Oli", description: "Oli mesin" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe("Oli");
  });
});
