import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("POST /column", () => {
  it("should post a column", async () => {
    const res = await request(app).post("/column").send({
      columnTitle: "This is a test",
      boardId: "686b2a9ac71ef04a860bc70b",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.columnId).toBeDefined();
  });
  it("should fail because board ID missing", async () => {
    const res = await request(app).post("/column").send({
      columnTitle: "This is a test",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
