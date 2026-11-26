import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

/* Cek endpoint root */
describe("GET /", () => {
  it("harus mengembalikan status 200 dan success true", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Penanganan error umum", () => {
  it("endpoint yang tidak ada membalas 404", async () => {
    const res = await request(app).get("/api/tidak-ada");

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("JSON yang rusak membalas 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{rusak");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Format JSON tidak valid");
  });
});
